type Task<T> = {
	fn: () => Promise<T>;
	resolve: (value: T) => void;
	reject: (reason: unknown) => void;
};

export function createTaskQueue(limit: number) {
	let active = 0;
	const waiting: Task<unknown>[] = [];

	function pump() {
		while (active < limit && waiting.length > 0) {
			const task = waiting.shift();
			if (!task) {
				return;
			}
			active += 1;
			void task
				.fn()
				.then(task.resolve, task.reject)
				.finally(() => {
					active -= 1;
					pump();
				});
		}
	}

	function run<T>(fn: () => Promise<T>) {
		return new Promise<T>((resolve, reject) => {
			waiting.push({
				fn,
				resolve: resolve as (value: unknown) => void,
				reject,
			});
			pump();
		});
	}

	return { run };
}
