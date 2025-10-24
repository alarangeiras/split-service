import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Duration } from "luxon";
import { NotFoundError } from "../api/errors/not-found-error";
import { PreconditionFailedError } from "../api/errors/precondition-failed-errors";
import db from "../config/knex";
import s3Client from "../config/s3";
import * as dao from "../dao";
import type { ExpenseModel } from "../dao/expense";
import type { MemberModel } from "../dao/member";
import { NotificationTemplate, NotificationType } from "../types/notification";
import { ReasonTypes } from "../types/reason";
import { ensureArray } from "../utils/array";
import * as notificationDomain from "./notification";

export async function addExpense(
	groupId: string,
	expense: Pick<ExpenseModel, "name" | "amount" | "payerId"> & {
		involvedMembers?: string[];
	},
) {
	const {
		payerId,
		amount: expenseAmount,
		name,
		involvedMembers: _involvedMembers,
	} = expense;
	const group = await dao.group.findById(groupId);
	if (!group) throw new NotFoundError("Group not found", { groupId });

	const [payer] = await dao.member.findBy(group.id, {
		includedMembers: [payerId],
	});

	if (!payer)
		throw new NotFoundError("Payer not found in the group", {
			groupId,
			payerId: payerId,
		});

	const involvedMembers = ensureArray(_involvedMembers);

	const members = await dao.member.findBy(group.id, {
		includedMembers: involvedMembers,
		excludedMembers: [payerId],
	});

	if (!members?.length) {
		throw new PreconditionFailedError("No member found in the group", {
			groupId,
			...(involvedMembers?.length ? { involvedMembers } : {}),
		});
	}

	const splitedDestinations = splitPayments(expense.amount, members);

	const result = await db.transaction(async (transaction) => {
		const expense = await dao.expense.createExpense(
			{
				groupId,
				payerId,
				name,
				amount: expenseAmount,
			},
			transaction,
		);
		const payerTransaction = await dao.transaction.createTransaction(
			{
				expenseId: expense.id,
				groupId,
				memberId: payerId,
				amount: -expenseAmount,
			},
			transaction,
		);
		const transactions = [payerTransaction];
		for (const destination of splitedDestinations) {
			const memberTransaction = await dao.transaction.createTransaction(
				{
					expenseId: expense.id,
					groupId,
					memberId: destination.id,
					amount: +destination.amount,
				},
				transaction,
			);
			transactions.push(memberTransaction);
		}
		return {
			...expense,
			transactions,
		};
	});

	await notificationDomain.dispatchNotificationEvent({
		type: NotificationType.EMAIL,
		template: NotificationTemplate.NEW_EXPENSE_RECORDED,
		email: payer.email,
		metadata: {
			name: payer.name,
			amount: -expenseAmount,
		},
	});

	for (const destination of splitedDestinations) {
		await notificationDomain.dispatchNotificationEvent({
			type: NotificationType.EMAIL,
			template: NotificationTemplate.NEW_EXPENSE_RECORDED,
			email: destination.email,
			metadata: {
				name: destination.name,
				amount: destination.amount,
			},
		});
	}

	return result;
}

export function splitPayments(
	expenseAmount: number,
	members: Array<MemberModel>,
) {
	const totalToSplit = members.length;
	const rawSplitValue = expenseAmount / totalToSplit;
	const leftOverAmount = Number.isInteger(rawSplitValue) ? 0 : 1;
	const finalAmount = Math.floor(rawSplitValue);
	return members.map((member, idx) => ({
		...member,
		amount: finalAmount + (idx === 0 ? leftOverAmount : 0),
	}));
}

export async function getBalances(groupId: string) {
	const group = await dao.group.findById(groupId);
	if (!group) throw new NotFoundError("Group not found", { groupId });

	return await dao.transaction.getBalancesByGroup(groupId);
}

export async function registerSettlement(
	groupId: string,
	senderId: string,
	receiverId: string,
	expenseId: string,
	amount: number,
) {
	const group = await dao.group.findById(groupId);
	if (!group) throw new NotFoundError("Group not found", { groupId });

	const expense = dao.expense.findById(expenseId);
	if (!expense)
		throw new NotFoundError("Expense not found", {
			groupId,
			senderId,
		});

	const [sender] = await dao.member.findBy(group.id, {
		includedMembers: [senderId],
	});

	if (!sender)
		throw new NotFoundError("Sender not found in the group", {
			groupId,
			senderId,
		});

	const [receiver] = await dao.member.findBy(group.id, {
		includedMembers: [receiverId],
	});

	if (!receiver)
		throw new NotFoundError("Receiver not found in the group", {
			groupId,
			receiverId,
		});

	await db.transaction(async (transaction) => {
		await dao.settlement.createSettlement(
			{
				expenseId,
				senderId,
				groupId,
				receiverId,
				amount: amount,
			},
			transaction,
		);
		await dao.transaction.createTransaction(
			{
				expenseId,
				groupId,
				memberId: senderId,
				amount: -amount,
			},
			transaction,
		);
		await dao.transaction.createTransaction(
			{
				expenseId,
				groupId,
				memberId: receiverId,
				amount: +amount,
			},
			transaction,
		);
	});

	await notificationDomain.dispatchNotificationEvent({
		type: NotificationType.EMAIL,
		template: NotificationTemplate.DEBT_SETTLED,
		email: sender.email,
		metadata: {
			name: sender.name,
			amount: -amount,
		},
	});

	await notificationDomain.dispatchNotificationEvent({
		type: NotificationType.EMAIL,
		template: NotificationTemplate.DEBT_SETTLED,
		email: receiver.email,
		metadata: {
			name: receiver.name,
			amount: +amount,
		},
	});
}

export async function requestUpload(groupId: string) {
	const group = await dao.group.findById(groupId);
	if (!group) throw new NotFoundError("Group not found", { groupId });

	const fileUniqueId = randomUUID();
	const fileKey = `expenses/${fileUniqueId}.csv`;

	const command = new PutObjectCommand({
		Bucket: "split-service-storage",
		Key: fileKey,
		ContentType: "text/csv",
	});

	const expiration = Duration.fromObject({ hour: 1 }).shiftTo("seconds");
	const url = await getSignedUrl(s3Client, command, {
		expiresIn: expiration.seconds,
	});

	await dao.batchQueue.createBatchQueue({
		groupId,
		reason: ReasonTypes.EXPENSES_BATCH_UPLOAD,
		fileKey,
	});

	const message =
		"Please upload the CSV file to the pre-signed URL. Be aware the url will expire in 1 hour.";

	return {
		url,
		message,
	};
}
