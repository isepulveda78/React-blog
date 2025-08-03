export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username: string;
  isAdmin?: boolean;
}

export function getStoredAuth(): AuthUser | null {
  try {
    const stored = localStorage.getItem('blogcraft_auth');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth(user: AuthUser | null): void {
  if (user) {
    localStorage.setItem('blogcraft_auth', JSON.stringify(user));
  } else {
    localStorage.removeItem('blogcraft_auth');
  }
}

export function isAuthenticated(): boolean {
  return getStoredAuth() !== null;
}

export function isAdmin(): boolean {
  const user = getStoredAuth();
  return user?.isAdmin === true;
}
