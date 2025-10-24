import { randomUUID } from "node:crypto";
import db from "../config/knex";
import type { ReasonTypes } from "../types/reason";

export async function createBatchQueue(params: {
	groupId: string;
	fileKey: string;
	reason: ReasonTypes;
}) {
	const id = randomUUID();
	await db("batch-queue").insert({
		id,
		group_id: params.groupId,
		reason: params.reason,
		file_key: params.fileKey,
	});
}
