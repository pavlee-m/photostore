import { createFileRoute } from "@tanstack/react-router";
import { PhotosLibrary } from "#/components/photos-library.tsx";

export const Route = createFileRoute("/_authenticated/")({
	component: PhotosPage,
});

function PhotosPage() {
	return <PhotosLibrary />;
}
