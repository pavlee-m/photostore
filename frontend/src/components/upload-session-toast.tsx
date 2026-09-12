import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "#/components/ui/progress.tsx";
import { cn } from "#/lib/utils.ts";
import {
	type ClientSession,
	type ClientUpload,
	useUploadsStore,
} from "#/stores/uploads.ts";

function sessionTitle(session: ClientSession) {
	const total = session.uploads.length;
	const complete = session.uploads.filter(
		(upload) => upload.status === "complete",
	).length;
	const failed = session.uploads.filter(
		(upload) => upload.status === "failed",
	).length;
	const retrying = session.uploads.filter(
		(upload) => upload.status === "retrying",
	).length;
	const active = session.uploads.filter(
		(upload) =>
			upload.status === "queued" ||
			upload.status === "uploading" ||
			upload.status === "retrying",
	).length;

	if (failed > 0 && active === 0) {
		return failed === total ? "Upload failed" : `${failed} of ${total} failed`;
	}
	if (retrying > 0 && retrying === active) {
		return `Retrying ${retrying} of ${total}`;
	}
	return `Uploading ${complete} of ${total}`;
}

function uploadProgress(upload: ClientUpload) {
	if (!upload.totalChunks || upload.totalChunks <= 0) {
		return 0;
	}
	return (upload.uploadedCount / upload.totalChunks) * 100;
}

function uploadDetail(upload: ClientUpload) {
	if (upload.status === "failed") {
		return upload.error ?? "Upload failed. Try again.";
	}
	if (upload.status === "retrying") {
		return "Retrying…";
	}
	if (upload.status === "complete") {
		return "Uploaded.";
	}
	if (upload.status === "queued") {
		return "Waiting…";
	}
	if (upload.totalChunks) {
		return `${upload.uploadedCount} of ${upload.totalChunks} parts`;
	}
	return "Starting…";
}

function UploadRow({ upload }: { upload: ClientUpload }) {
	return (
		<li className="space-y-1">
			<div className="flex items-baseline justify-between gap-2">
				<span className="min-w-0 truncate font-medium">{upload.filename}</span>
			</div>
			<p className="text-xs text-muted-foreground">{uploadDetail(upload)}</p>
			{upload.status === "uploading" || upload.status === "retrying" ? (
				<Progress value={uploadProgress(upload)} />
			) : null}
		</li>
	);
}

export function UploadSessionToast({ sessionId }: { sessionId: string }) {
	const session = useUploadsStore((state) =>
		state.sessions.find((item) => item.id === sessionId),
	);
	const setExpanded = useUploadsStore((state) => state.setSessionExpanded);

	if (!session) {
		return null;
	}

	const multiple = session.uploads.length > 1;
	const showList = !multiple || session.expanded;
	const problems = session.uploads.filter(
		(upload) => upload.status === "failed" || upload.status === "retrying",
	);
	const single = session.uploads[0];

	if (!multiple && single) {
		return (
			<div className="w-[min(100%,20rem)] space-y-1">
				<p className="font-medium">{single.filename}</p>
				<p className="text-xs text-muted-foreground">{uploadDetail(single)}</p>
				{single.status === "uploading" || single.status === "retrying" ? (
					<Progress value={uploadProgress(single)} />
				) : null}
			</div>
		);
	}

	return (
		<div className="w-[min(100%,20rem)]">
			<button
				aria-expanded={session.expanded}
				className="flex w-full items-center gap-1 text-left font-medium"
				onClick={(event) => {
					event.preventDefault();
					event.stopPropagation();
					setExpanded(sessionId, !session.expanded);
				}}
				type="button"
			>
				<span className="min-w-0 flex-1 truncate">{sessionTitle(session)}</span>
				<ChevronDown
					className={cn(
						"size-4 shrink-0 transition-transform",
						session.expanded ? "rotate-180" : "rotate-0",
					)}
				/>
			</button>
			{!showList && problems.length > 0 ? (
				<ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
					{problems.map((upload) => (
						<li className="truncate" key={upload.id}>
							{upload.filename}
							{upload.status === "failed" && upload.error
								? ` — ${upload.error}`
								: upload.status === "retrying"
									? " — Retrying…"
									: null}
						</li>
					))}
				</ul>
			) : null}
			{showList ? (
				<ul className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-1">
					{session.uploads.map((upload) => (
						<UploadRow key={upload.id} upload={upload} />
					))}
				</ul>
			) : null}
		</div>
	);
}

export function showSessionLoadingToast(sessionId: string) {
	toast.loading(<UploadSessionToast sessionId={sessionId} />, {
		id: sessionId,
		closeButton: true,
		duration: Number.POSITIVE_INFINITY,
	});
}

export function showSessionErrorToast(sessionId: string) {
	toast.error(<UploadSessionToast sessionId={sessionId} />, {
		id: sessionId,
		closeButton: true,
		duration: Number.POSITIVE_INFINITY,
		onDismiss: () => useUploadsStore.getState().removeSession(sessionId),
	});
}
