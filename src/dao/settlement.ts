import { randomUUID } from "node:crypto";
import type knex from "knex";

export type SettlementModel = {
	id: string;
	groupId: string;
	senderId: string;
	receiverId: string;
	expenseId: string;
	amount: number;
	created: Date;
};

export async function createSettlement(
	params: {
		senderId: string;
		receiverId: string;
		expenseId: string;
		groupId: string;
		amount: number;
	},
	trx: knex.Knex.Transaction,
) {
	const id = randomUUID();
	await trx.table("settlements").insert({
		id,
		sender_id: params.senderId,
		receiver_id: params.receiverId,
		group_id: params.groupId,
		expense_id: params.expenseId,
		amount: params.amount,
	});
}
