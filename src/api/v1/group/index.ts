import { type Request, type Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import z from "zod";
import * as domain from "../../../domain";
import {
	validateBody,
	validatePathParam,
} from "../../../middlewares/request-validation";
import { AddGroupMember, CreateGroup } from "../group/validation";

const router = Router();

router.post(
	"/",
	validateBody(CreateGroup),
	async (req: Request, res: Response) => {
		const group = CreateGroup.parse(req.body);
		const result = await domain.group.create(group);
		res.status(StatusCodes.CREATED).send(result);
	},
);

router.get(
	"/:id",
	validatePathParam(z.object({ id: z.uuid() })),
	async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const response = await domain.group.find(id);
		res.json(response);
	},
);

router.post(
	"/:id/create-member",
	validatePathParam(z.object({ id: z.uuid() })),
	validateBody(AddGroupMember),
	async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const groupMember = AddGroupMember.parse(req.body);
		const response = await domain.group.createMember(id, groupMember);
		res.status(StatusCodes.CREATED).send(response);
	},
);

router.get(
	"/:id/members",
	validatePathParam(z.object({ id: z.uuid() })),
	async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const response = await domain.group.getMembers(id);
		res.send(response);
	},
);

export default router;
