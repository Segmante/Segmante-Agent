// Simple client-side session storage for user replica information
// In a production app, this would typically be stored in a database or secure session

export interface UserSession {
  userId: string;
  replicaUuid: string;
  shopifyDomain: string;
  storeName?: string;
  createdAt: string;
}

const USER_SESSION_KEY = 'segmante_user_session';

export class UserSessionManager {
  /**
   * Save user session to localStorage
   */
  static saveUserSession(session: UserSession): void {
    try {
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
      console.log('User session saved:', session.userId);
    } catch (error) {
      console.error('Error saving user session:', error);
    }
  }

  /**
   * Get current user session
   */
  static getUserSession(): UserSession | null {
    try {
      const stored = localStorage.getItem(USER_SESSION_KEY);
      if (!stored) return null;

      const session = JSON.parse(stored) as UserSession;
      console.log('Retrieved user session:', session.userId);
      return session;
    } catch (error) {
      console.error('Error retrieving user session:', error);
      return null;
    }
  }

  /**
   * Clear user session
   */
  static clearUserSession(): void {
    try {
      localStorage.removeItem(USER_SESSION_KEY);
      console.log('User session cleared');
    } catch (error) {
      console.error('Error clearing user session:', error);
    }
  }

  /**
   * Check if user has an active session
   */
  static hasActiveSession(): boolean {
    return this.getUserSession() !== null;
  }

  /**
   * Get user replica UUID for chat
   */
  static getUserReplicaUuid(): string | null {
    const session = this.getUserSession();
    return session?.replicaUuid || null;
  }

  /**
   * Get user ID for chat
   */
  static getUserId(): string | null {
    const session = this.getUserSession();
    return session?.userId || null;
  }
}