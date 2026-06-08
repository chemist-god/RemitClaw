/** Run work after first paint so navigation and shell render stay fast. */
export function deferNonCritical(task: () => void, timeoutMs = 1200): () => void {
  if (typeof window === "undefined") {
    task();
    return () => {};
  }

  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(() => task(), { timeout: timeoutMs });
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(task, 1);
  return () => window.clearTimeout(id);
}
