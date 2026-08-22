export function formatStorageMb(mb: number) {
	if (!Number.isFinite(mb) || mb < 0) {
		return "0 MB";
	}
	if (mb >= 1024) {
		const gb = mb / 1024;
		return `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB`;
	}
	return `${Math.round(mb)} MB`;
}

export function storagePercent(used: number, total: number) {
	if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) {
		return 0;
	}
	return Math.min(100, Math.max(0, Math.round((used / total) * 100)));
}

export function profilePictureSrc(url: string | null | undefined) {
	if (!url) {
		return null;
	}
	if (
		url.startsWith("http://") ||
		url.startsWith("https://") ||
		url.startsWith("/")
	) {
		return url;
	}
	return null;
}
