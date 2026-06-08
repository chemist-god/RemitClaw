type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/** Run work after first paint so navigation and shell render stay fast. */
export function deferNonCritical(task: () => void, timeoutMs = 1200): () => void {
  if (typeof window === "undefined") {
    task();
    return () => {};
  }

  const win = window as IdleWindow;
  if (win.requestIdleCallback) {
    const id = win.requestIdleCallback(() => task(), { timeout: timeoutMs });
    return () => win.cancelIdleCallback?.(id);
  }

  const id = setTimeout(task, 1);
  return () => clearTimeout(id);
}
