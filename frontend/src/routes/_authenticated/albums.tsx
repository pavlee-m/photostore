import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/albums")({
	component: AlbumsPage,
});

function AlbumsPage() {
	return (
		<main className="page-wrap py-10">
			<section className="island-shell rounded-2xl p-8">
				<p className="island-kicker">Library</p>
				<h2 className="display-title mt-2 text-3xl">Albums</h2>
				<p className="mt-3 text-[var(--sea-ink-soft)]">
					Album management will be added next.
				</p>
			</section>
		</main>
	);
}
