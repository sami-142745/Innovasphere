const pendingRequests = new Map<string, Promise<any>>();

export function deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  const existing = pendingRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

export function cancelPendingRequest(key: string): void {
  const promise = pendingRequests.get(key);
  if (promise) {
    pendingRequests.delete(key);
  }
}

export function clearPendingRequests(): void {
  pendingRequests.clear();
}