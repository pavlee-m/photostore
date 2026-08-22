import { useEffect, useState } from "react";
import { fetchAlbumCoverBlob } from "#/api/album.ts";

const objectUrls = new Map<number, string>();
const inflight = new Map<number, Promise<string | null>>();

function getAlbumCoverUrl(id: number) {
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

export function useAlbumCoverUrl(id: number | null) {
	const [url, setUrl] = useState<string | null>(() =>
		id == null ? null : (objectUrls.get(id) ?? null),
	);
	const [error, setError] = useState(false);

	useEffect(() => {
		if (id == null) {
			setUrl(null);
			return;
		}
		let cancelled = false;
		setError(false);
		void getAlbumCoverUrl(id)
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
	}, [id]);

	return { url, error };
}
