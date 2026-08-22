export function safeInternalPath(value: string | undefined) {
	if (value?.startsWith("/") && !value.startsWith("//")) {
		return value;
	}
	return "/";
}

export function fieldErrorMessage(errors: unknown[]) {
	const first = errors[0];
	if (!first) {
		return undefined;
	}
	if (typeof first === "string") {
		return first;
	}
	if (
		typeof first === "object" &&
		first !== null &&
		"message" in first &&
		typeof first.message === "string"
	) {
		return first.message;
	}
	return undefined;
}
