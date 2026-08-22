import { useEffect, useState } from "react";
import { fetchAlbumCoverBlob } from "#/api/album.ts";

const objectUrls = new Map<number, string>();
const inflight = new Map<number, Promise<string | null>>();
const subscribers = new Map<number, Set<() => void>>();

function getAlbumCoverUrl(id: number, _revision = 0) {
	const cached = objectUrls.get(id);
	if (cached) {
		return Promise.resolve(cached);
	}
	const pending = inflight.get(id);
	if (pending) {
		return pending;
	}
	const request = fetchAlbumCoverBlob(id)
		.then((blob) => {
			if (!blob) {
				return null;
			}
			const url = URL.createObjectURL(blob);
			objectUrls.set(id, url);
			return url;
		})
		.finally(() => {
			inflight.delete(id);
		});
	inflight.set(id, request);
	return request;
}

export function forgetAlbumCoverUrl(id: number) {
	const url = objectUrls.get(id);
	if (url) {
		URL.revokeObjectURL(url);
		objectUrls.delete(id);
	}
	inflight.delete(id);
	for (const notify of subscribers.get(id) ?? []) {
		notify();
	}
}

export function useAlbumCoverUrl(id: number | null) {
	const [url, setUrl] = useState<string | null>(() =>
		id == null ? null : (objectUrls.get(id) ?? null),
	);
	const [error, setError] = useState(false);
	const [revision, setRevision] = useState(0);

	useEffect(() => {
		if (id == null) {
			return;
		}
		const listeners = subscribers.get(id) ?? new Set<() => void>();
		const notify = () => setRevision((current) => current + 1);
		listeners.add(notify);
		subscribers.set(id, listeners);
		return () => {
			listeners.delete(notify);
			if (listeners.size === 0) {
				subscribers.delete(id);
			}
		};
	}, [id]);

	useEffect(() => {
		if (id == null) {
			setUrl(null);
			return;
		}
		let cancelled = false;
		setUrl(objectUrls.get(id) ?? null);
		setError(false);
		void getAlbumCoverUrl(id, revision)
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
	}, [id, revision]);

	return { url, error };
}
