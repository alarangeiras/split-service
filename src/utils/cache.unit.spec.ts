import { cache, expireCache } from "./cache";

describe("cache", () => {
	beforeAll(async () => {
		expireCache("chore/test");
	});
	describe("cache", () => {
		it("should create a cache and used it on the second call", async () => {
			const callbackFunction = jest.fn();
			callbackFunction.mockResolvedValueOnce({
				flag: true,
			});
			callbackFunction.mockResolvedValueOnce({
				flag: false,
			});
			callbackFunction.mockResolvedValueOnce({
				flag: false,
			});
			await expect(
				cache("chore/test", () => callbackFunction(), 100000),
			).resolves.toEqual({
				flag: true,
			});
			await expect(
				cache("chore/test", () => callbackFunction(), 100000),
			).resolves.toEqual({
				flag: true,
			});
			await expireCache("chore/test");
			await expect(
				cache("chore/test", () => callbackFunction(), 100000),
			).resolves.toEqual({
				flag: false,
			});
		});
	});
});
