import { randomUUID } from "node:crypto";
import db from "../config/knex";

export type MemberDBModel = {
	id: string;
	name: string;
	email: string;
	group_id: string;
};

export type MemberModel = {
	id: string;
	name: string;
	email: string;
	groupId: string;
};

export function mapToModel(dbModel: MemberDBModel): MemberModel {
	return {
		id: dbModel.id,
		name: dbModel.name,
		email: dbModel.email,
		groupId: dbModel.group_id,
	};
}

export async function create(
	groupId: string,
	member: Omit<MemberModel, "id" | "groupId">,
) {
	const id = randomUUID();
	await db.table("members").insert({
		...member,
		id,
		group_id: groupId,
	});

	return mapToModel(await db.table("members").where("id", id).first());
}

export async function findBy(
	groupId: string,
	criteria?: {
		includedMembers?: string[];
		excludedMembers?: string[];
	},
) {
	const query = db.table<MemberDBModel>("members").where("group_id", groupId);

	if (criteria?.includedMembers?.length) {
		query.whereIn("id", criteria?.includedMembers);
	}

	if (criteria?.excludedMembers?.length) {
		query.whereNotIn("id", criteria?.excludedMembers);
	}

	const result = await query;
	return result.map((db) => mapToModel(db));
}
