import type { MediaFile } from "#/types/media.ts";

function pad(value: number) {
	return String(value).padStart(2, "0");
}

export function localDateKeyFromDate(date: Date) {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function localDateKey(isoDate: string) {
	const date = new Date(isoDate);
	if (Number.isNaN(date.getTime())) {
		return "Unknown";
	}
	return localDateKeyFromDate(date);
}

export function formatDateHeading(dateKey: string) {
	if (dateKey === "Unknown") {
		return "Unknown date";
	}
	const [year, month, day] = dateKey.split("-").map(Number);
	const date = new Date(year, (month ?? 1) - 1, day ?? 1);
	const todayKey = localDateKeyFromDate(new Date());
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	const yesterdayKey = localDateKeyFromDate(yesterday);

	if (dateKey === todayKey) {
		return "Today";
	}
	if (dateKey === yesterdayKey) {
		return "Yesterday";
	}
	return new Intl.DateTimeFormat(undefined, {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric",
	}).format(date);
}

export function groupMediaByDate(items: MediaFile[]) {
	const groups: { dateKey: string; label: string; items: MediaFile[] }[] = [];
	const indexByKey = new Map<string, number>();

	for (const item of items) {
		const dateKey = localDateKey(item.uploadedAt);
		const existing = indexByKey.get(dateKey);
		if (existing === undefined) {
			indexByKey.set(dateKey, groups.length);
			groups.push({
				dateKey,
				label: formatDateHeading(dateKey),
				items: [item],
			});
		} else {
			groups[existing]?.items.push(item);
		}
	}

	return groups;
}
