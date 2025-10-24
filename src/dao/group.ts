import { randomUUID } from "node:crypto";
import knex from "../config/knex";
import type { Nullable } from "../utils/object";

export const GROUP_TABLE_NAME = "groups";

export type GroupModel = {
	id: string;
	name: string;
};

export async function findById(uid: string): Promise<Nullable<GroupModel>> {
	return knex.table(GROUP_TABLE_NAME).where("id", uid).first();
}

export async function createGroup(
	group: Omit<GroupModel, "id">,
): Promise<GroupModel> {
	const id = randomUUID();
	await knex.table(GROUP_TABLE_NAME).insert({
		...group,
		id,
	});
	return knex.table(GROUP_TABLE_NAME).where("id", id).first();
}
