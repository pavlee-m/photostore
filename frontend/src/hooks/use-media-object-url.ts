import { useEffect, useState } from "react";
import { fetchMediaBlob, fetchMediaThumbnail } from "#/api/media.ts";
import { createTaskQueue } from "#/lib/task-queue.ts";

type MediaKind = "full" | "thumb";

const objectUrls = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();
const thumbQueue = createTaskQueue(4);

function cacheKey(kind: MediaKind, id: number) {
	return `${kind}:${id}`;
}

export function getMediaObjectUrl(id: number, kind: MediaKind = "full") {
	const key = cacheKey(kind, id);
	const cached = objectUrls.get(key);
	if (cached) {
		return Promise.resolve(cached);
	}
	const pending = inflight.get(key);
	if (pending) {
		return pending;
	}
	const load = () =>
		(kind === "thumb" ? fetchMediaThumbnail(id) : fetchMediaBlob(id)).then(
			(blob) => {
				const url = URL.createObjectURL(blob);
				objectUrls.set(key, url);
				return url;
			},
		);
	const request = (kind === "thumb" ? thumbQueue.run(load) : load()).finally(
		() => {
			inflight.delete(key);
		},
	);
	inflight.set(key, request);
	return request;
}

export function forgetMediaObjectUrl(id: number) {
	for (const kind of ["full", "thumb"] as const) {
		const key = cacheKey(kind, id);
		const url = objectUrls.get(key);
		if (url) {
			URL.revokeObjectURL(url);
			objectUrls.delete(key);
		}
	}
}

export function useMediaObjectUrl(
	id: number | null,
	kind: MediaKind = "full",
	enabled = true,
) {
	const [url, setUrl] = useState<string | null>(() =>
		id == null || !enabled
			? null
			: (objectUrls.get(cacheKey(kind, id)) ?? null),
	);
	const [error, setError] = useState(false);

	useEffect(() => {
		if (id == null || !enabled) {
			setUrl(null);
			return;
		}
		let cancelled = false;
		setError(false);
		void getMediaObjectUrl(id, kind)
			.then((nextUrl) => {
				if (!cancelled) {
					setUrl(nextUrl);
				}
			})
			.catch(() => {
				if (!cancelled) {
					setError(true);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [enabled, id, kind]);

	return { url, error };
}
