type PendingRequest = {
  promise: Promise<unknown>;
  controller: AbortController;
  /** How many callers are currently interested in this in-flight request. */
  subscribers: number;
};

const pendingRequests = new Map<string, PendingRequest>();

/**
 * Collapses concurrent identical requests into a single network call.
 *
 * <p>The manager owns the {@link AbortController} and hands it to the request
 * factory, so the factory can both read `controller.signal` for the transport
 * and abort the shared request. Because the entry is removed from the map the
 * moment it settles - and synchronously on {@link cancelPendingRequest} - an
 * already cancelled request can never be handed to a new caller.
 */
export function deduplicateRequest<T>(
  key: string,
  requestFn: (controller: AbortController) => Promise<T>
): Promise<T> {
  const existing = pendingRequests.get(key);
  if (existing) {
    existing.subscribers += 1;
    return existing.promise as Promise<T>;
  }

  const controller = new AbortController();

  const entry: PendingRequest = {
    // Replaced immediately below; the reference is needed so the finally block
    // can recognise its own entry.
    promise: undefined as unknown as Promise<unknown>,
    controller,
    subscribers: 1
  };

  entry.promise = requestFn(controller).finally(() => {
    // Only clear the map if it still points at *this* request. A cancelled
    // entry is removed synchronously by releaseRequest/cancelPendingRequest,
    // and a new caller may already have inserted a fresh entry under the same
    // key - deleting unconditionally would orphan that live request.
    if (pendingRequests.get(key) === entry) {
      pendingRequests.delete(key);
    }
  });

  pendingRequests.set(key, entry);
  return entry.promise as Promise<T>;
}

/**
 * Drops one interest in an in-flight request. The request is only aborted once
 * nobody is waiting on it, so one component unmounting can never cancel a
 * response another component is still rendering.
 */
export function releaseRequest(key: string): void {
  const entry = pendingRequests.get(key);
  if (!entry) return;
  entry.subscribers -= 1;
  if (entry.subscribers <= 0) {
    pendingRequests.delete(key);
    entry.controller.abort();
  }
}

/**
 * Force-cancels an in-flight request regardless of subscriber count.
 */
export function cancelPendingRequest(key: string): void {
  const entry = pendingRequests.get(key);
  if (!entry) return;
  pendingRequests.delete(key);
  entry.controller.abort();
}

export function clearPendingRequests(): void {
  for (const entry of pendingRequests.values()) {
    entry.controller.abort();
  }
  pendingRequests.clear();
}
