import { randomUUID } from "node:crypto";
import type knex from "knex";
import db from "../config/knex";

export type ExpenseDBModel = {
	id: string;
	name: string;
	amount: number;
	group_id: string;
	payer_id: string;
	created: Date;
};

export type ExpenseModel = {
	id: string;
	name: string;
	amount: number;
	groupId: string;
	payerId: string;
	created: Date;
};

function mapToModel(db: ExpenseDBModel): ExpenseModel {
	return {
		id: db.id,
		name: db.name,
		amount: db.amount,
		groupId: db.group_id,
		payerId: db.payer_id,
		created: db.created,
	};
}

export async function findById(expenseId: string) {
	const result = await db
		.table<ExpenseDBModel>("expenses")
		.where("id", expenseId)
		.first();

	if (!result) return null;
	return mapToModel(result);
}

export async function createExpense(
	params: { groupId: string; name: string; payerId: string; amount: number },
	trx: knex.Knex.Transaction,
) {
	const id = randomUUID();
	await trx.table("expenses").insert({
		id,
		name: params.name,
		amount: params.amount,
		group_id: params.groupId,
		payer_id: params.payerId,
	});

	const result = await trx
		.table<ExpenseDBModel>("expenses")
		.where("id", id)
		.first();
	return mapToModel(result);
}
