import { useEffect, useState } from "react";
import { fetchProfilePicture } from "#/api/user.ts";

const objectUrls = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();

function cacheKey(userId: number, pictureUrl: string) {
	return `${userId}:${pictureUrl}`;
}

export function forgetProfilePicture(userId: number) {
	for (const [key, url] of objectUrls) {
		if (key.startsWith(`${userId}:`)) {
			URL.revokeObjectURL(url);
			objectUrls.delete(key);
		}
	}
}

export function useProfilePictureUrl(
	userId: number,
	pictureUrl: string | null | undefined,
) {
	const key = pictureUrl ? cacheKey(userId, pictureUrl) : null;
	const [url, setUrl] = useState<string | null>(() =>
		key ? (objectUrls.get(key) ?? null) : null,
	);

	useEffect(() => {
		if (!key) {
			setUrl(null);
			return;
		}
		const cached = objectUrls.get(key);
		if (cached) {
			setUrl(cached);
			return;
		}
		let cancelled = false;
		const pending = inflight.get(key);
		const request =
			pending ??
			fetchProfilePicture()
				.then((blob) => {
					if (!blob) {
						return null;
					}
					const objectUrl = URL.createObjectURL(blob);
					objectUrls.set(key, objectUrl);
					return objectUrl;
				})
				.finally(() => {
					inflight.delete(key);
				});
		if (!pending) {
			inflight.set(key, request);
		}
		void request.then((nextUrl) => {
			if (!cancelled) {
				setUrl(nextUrl);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [key]);

	return url;
}
