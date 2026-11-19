/**
 * Holds the ID of the currently authenticated user so that service-layer
 * functions can build user-specific cache keys without threading the user ID
 * through every service method.
 *
 * AuthContext calls setCurrentUserId() when the user logs in or their profile
 * is refreshed, and clears it on logout.
 */
let currentUserId: string | null = null;

/**
 * Set the current user ID. Called by AuthContext on login / profile refresh.
 */
export function setCurrentUserId(userId: string | null): void {
  currentUserId = userId;
}

/**
 * Get the current user ID, or null if no user is authenticated.
 */
export function getCurrentUserId(): string | null {
  return currentUserId;
}
