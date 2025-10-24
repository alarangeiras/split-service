import { NotFoundError } from "../api/errors/not-found-error";
import * as dao from "../dao";
import type { GroupModel } from "../dao/group";
import type { MemberModel } from "../dao/member";

export async function create(group: Omit<GroupModel, "id">) {
	return await dao.group.createGroup(group);
}

export async function find(id: string) {
	const group = await dao.group.findById(id);
	if (!group) throw new NotFoundError("group not found");

	return group;
}

export async function createMember(
	groupId: string,
	member: Omit<MemberModel, "id" | "groupId">,
) {
	await find(groupId);

	return dao.member.create(groupId, member);
}

export async function addExistingMember(
	groupId: string,
	member: Omit<MemberModel, "id" | "groupId">,
) {
	await find(groupId);

	return dao.member.create(groupId, member);
}

export async function getMembers(groupId: string) {
	await find(groupId);

	return dao.member.findBy(groupId);
}
