import { randomUUID } from "node:crypto";
import type knex from "knex";
import db from "../config/knex";

export type TransactionDBModel = {
	id: string;
	group_id: string;
	member_id: string;
	expense_id: string;
	amount: number;
	created: Date;
};

export type TransactionModel = {
	id: string;
	groupId: string;
	memberId: string;
	expenseId: string;
	amount: number;
	created: Date;
};

function mapToModel(db: TransactionDBModel): TransactionModel {
	return {
		id: db.id,
		groupId: db.group_id,
		memberId: db.member_id,
		expenseId: db.expense_id,
		amount: db.amount,
		created: db.created,
	};
}

export async function createTransaction(
	params: {
		groupId: string;
		memberId: string;
		expenseId: string;
		amount: number;
	},
	trx: knex.Knex.Transaction,
) {
	const id = randomUUID();
	await trx.table("transactions").insert({
		id,
		group_id: params.groupId,
		member_id: params.memberId,
		expense_id: params.expenseId,
		amount: params.amount,
	});
	const result = await trx
		.table<TransactionDBModel>("transactions")
		.where("id", id)
		.first();
	return mapToModel(result);
}

export async function getBalancesByGroup(groupId: string) {
	const result = await db("transactions")
		.select(["member_id"])
		.where("group_id", groupId)
		.groupBy("member_id")
		.sum("amount as balance");
	return result.map((r) => ({
		memberId: r.member_id,
		balance: r.balance,
	}));
}
