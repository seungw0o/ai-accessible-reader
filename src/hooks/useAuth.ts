import { useMemo, useState } from 'react';
import type { AuthUser } from '../types';

type StoredUser = AuthUser & {
  password: string;
};

const USERS_STORAGE_KEY = 'reader-users';
const SESSION_STORAGE_KEY = 'reader-current-user-id';

function readUsers(): StoredUser[] {
  try {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toPublicUser(user: StoredUser): AuthUser {
  const { password: _password, ...publicUser } = user;
  return publicUser;
}

export function useAuth() {
  const [users, setUsers] = useState<StoredUser[]>(readUsers);
  const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem(SESSION_STORAGE_KEY) || '');

  const currentUser = useMemo(() => {
    const user = users.find((candidate) => candidate.id === currentUserId);
    return user ? toPublicUser(user) : null;
  }, [currentUserId, users]);

  const signUp = (name: string, email: string, password: string) => {
    const nextEmail = normalizeEmail(email);
    if (users.some((user) => user.email === nextEmail)) {
      return { ok: false, reason: 'duplicate' as const };
    }

    const nextUser: StoredUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: nextEmail,
      password,
      createdAt: new Date().toISOString(),
    };
    const nextUsers = [nextUser, ...users];
    setUsers(nextUsers);
    writeUsers(nextUsers);
    setCurrentUserId(nextUser.id);
    localStorage.setItem(SESSION_STORAGE_KEY, nextUser.id);
    return { ok: true, user: toPublicUser(nextUser) };
  };

  const signIn = (email: string, password: string) => {
    const nextEmail = normalizeEmail(email);
    const user = users.find((candidate) => candidate.email === nextEmail && candidate.password === password);
    if (!user) {
      return { ok: false, reason: 'invalid' as const };
    }

    setCurrentUserId(user.id);
    localStorage.setItem(SESSION_STORAGE_KEY, user.id);
    return { ok: true, user: toPublicUser(user) };
  };

  const signOut = () => {
    setCurrentUserId('');
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  return {
    currentUser,
    isAuthenticated: !!currentUser,
    signIn,
    signUp,
    signOut,
  };
}
