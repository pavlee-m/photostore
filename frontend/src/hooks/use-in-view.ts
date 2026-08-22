import { useEffect, useState } from "react";

export function useInView<T extends Element>(rootMargin = "600px") {
	const [node, setNode] = useState<T | null>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (!node || visible) {
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					setVisible(true);
					observer.disconnect();
				}
			},
			{ rootMargin },
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, [node, rootMargin, visible]);

	return { setNode, visible };
}
