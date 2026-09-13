import { describe, expect, test } from "bun:test";
import {
	checkmarkKind,
	describePickDelete,
	IDLE,
	isPickGridPath,
	isPicked,
	photoClick,
	pickCount,
	pickedIds,
	reducePick,
	type MediaPickState,
	type PickedPhoto,
} from "./media-pick.ts";

const a: PickedPhoto = { id: 1, name: "one.jpg" };
const b: PickedPhoto = { id: 2, name: "two.jpg" };

function picking(...photos: PickedPhoto[]): MediaPickState {
	const ids = pickedIds(photos);
	if (!ids) {
		throw new Error("expected nonempty pick");
	}
	return { phase: "picking", ids };
}

describe("reducePick", () => {
	test("toggle from idle enters picking with that photo", () => {
		const next = reducePick(IDLE, { type: "toggle", photo: a });
		expect(next).toEqual(picking(a));
	});

	test("last un-toggle returns idle", () => {
		const next = reducePick(picking(a), { type: "toggle", photo: a });
		expect(next).toBe(IDLE);
	});

	test("toggle adds and removes while other picks remain", () => {
		const two = reducePick(picking(a), { type: "toggle", photo: b });
		expect(two).toEqual(picking(a, b));
		expect(reducePick(two, { type: "toggle", photo: a })).toEqual(picking(b));
	});

	test("drop of the last id returns idle", () => {
		expect(reducePick(picking(a, b), { type: "drop", ids: [1, 2] })).toBe(IDLE);
	});

	test("drop of unknown ids is a no-op", () => {
		const state = picking(a);
		expect(reducePick(state, { type: "drop", ids: [99] })).toBe(state);
	});

	test("reveal arms idle and replaces the revealed id", () => {
		const armed = reducePick(IDLE, { type: "reveal", id: 1 });
		expect(armed).toEqual({ phase: "armed", revealed: 1 });
		expect(reducePick(armed, { type: "reveal", id: 2 })).toEqual({
			phase: "armed",
			revealed: 2,
		});
	});

	test("reveal does not change picking", () => {
		const state = picking(a);
		expect(reducePick(state, { type: "reveal", id: 2 })).toBe(state);
	});

	test("leave from picking or armed returns idle", () => {
		expect(reducePick(picking(a), { type: "leave" })).toBe(IDLE);
		expect(
			reducePick({ phase: "armed", revealed: 1 }, { type: "leave" }),
		).toBe(IDLE);
	});

	test("leave on idle keeps the same object", () => {
		expect(reducePick(IDLE, { type: "leave" })).toBe(IDLE);
	});
});

describe("photoClick and checkmarkKind", () => {
	test("fine pointer opens while idle or armed", () => {
		expect(photoClick(IDLE, 1, "fine")).toBe("open");
		expect(photoClick({ phase: "armed", revealed: 1 }, 1, "fine")).toBe("open");
		expect(checkmarkKind(IDLE, 1, "fine")).toBe("hover");
		expect(checkmarkKind({ phase: "armed", revealed: 2 }, 1, "fine")).toBe(
			"hover",
		);
	});

	test("coarse idle reveals and hides the checkmark", () => {
		expect(photoClick(IDLE, 1, "coarse")).toBe("reveal");
		expect(checkmarkKind(IDLE, 1, "coarse")).toBe("absent");
	});

	test("coarse armed same tile opens with a revealed checkmark", () => {
		const armed: MediaPickState = { phase: "armed", revealed: 1 };
		expect(photoClick(armed, 1, "coarse")).toBe("open");
		expect(checkmarkKind(armed, 1, "coarse")).toBe("revealed");
		expect(photoClick(armed, 2, "coarse")).toBe("reveal");
		expect(checkmarkKind(armed, 2, "coarse")).toBe("absent");
	});

	test("picking toggles and shows a checkmark on every tile", () => {
		const state = picking(a);
		expect(photoClick(state, 1, "fine")).toBe("toggle");
		expect(photoClick(state, 2, "coarse")).toBe("toggle");
		expect(checkmarkKind(state, 1, "fine")).toBe("on");
		expect(checkmarkKind(state, 2, "coarse")).toBe("on");
		expect(isPicked(state, 1)).toBe(true);
		expect(isPicked(state, 2)).toBe(false);
		expect(pickCount(state)).toBe(1);
		expect(pickCount(IDLE)).toBe(0);
	});
});

describe("isPickGridPath", () => {
	test("only the library and an album photo grid stay armed", () => {
		expect(isPickGridPath("/")).toBe(true);
		expect(isPickGridPath("/albums/12")).toBe(true);
		expect(isPickGridPath("/albums")).toBe(false);
		expect(isPickGridPath("/albums/12/edit")).toBe(false);
		expect(isPickGridPath("/profile")).toBe(false);
		expect(isPickGridPath("/admin")).toBe(false);
	});
});

describe("describePickDelete", () => {
	test("names the file when one photo is picked", () => {
		const ids = pickedIds([a]);
		if (!ids) {
			throw new Error("expected nonempty pick");
		}
		expect(describePickDelete(ids)).toEqual({
			title: "Delete photo",
			confirmLabel: "Delete photo",
			description:
				"Delete one.jpg? This removes it from your library and every album. This cannot be undone.",
		});
	});

	test("covers N when several photos are picked", () => {
		const ids = pickedIds([a, b]);
		if (!ids) {
			throw new Error("expected nonempty pick");
		}
		expect(describePickDelete(ids)).toEqual({
			title: "Delete 2 photos",
			confirmLabel: "Delete 2 photos",
			description:
				"Delete 2 photos? This removes them from your library and every album. This cannot be undone.",
		});
	});
});
