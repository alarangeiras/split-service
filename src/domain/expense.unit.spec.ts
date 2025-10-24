import { randomUUID } from "node:crypto";
import type { MemberModel } from "../dao/member";
import { splitPayments } from "./expense";

describe("expense domain", () => {
	describe("splitPayments", () => {
		it("should split equaly by the remaining members", () => {
			const expenseAmount = 1000; // amount in cents
			const members = [
				{ id: randomUUID() },
				{ id: randomUUID() },
			] as MemberModel[];
			const result = splitPayments(expenseAmount, members);
			expect(result).toEqual([
				{
					id: expect.any(String),
					amount: 500,
				},
				{
					id: expect.any(String),
					amount: 500,
				},
			]);
		});
		it("should split equaly by the remaining members and add the left over on the first occurrence", () => {
			const expenseAmount = 1000; // amount in cents
			const members = [
				{ id: randomUUID() },
				{ id: randomUUID() },
				{ id: randomUUID() },
			] as MemberModel[];
			const result = splitPayments(expenseAmount, members);
			expect(result).toEqual([
				{
					id: expect.any(String),
					amount: 334,
				},
				{
					id: expect.any(String),
					amount: 333,
				},
				{
					id: expect.any(String),
					amount: 333,
				},
			]);
		});
	});
});
