import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const scrypt = promisify(nodeScrypt);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const authStorePath = path.join(dataDir, 'auth-store.json');
const defaultStore = {
  users: [],
  sessions: [],
};
const sessionTtlMs =
  Number(process.env.AUTH_SESSION_TTL_HOURS || 168) * 60 * 60 * 1000;
const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function normalizeStore(store) {
  return {
    users: Array.isArray(store?.users) ? store.users : [],
    sessions: Array.isArray(store?.sessions) ? store.sessions : [],
  };
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function passwordMeetsRequirements(password) {
  return passwordPattern.test(password);
}

export function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt ?? null,
  };
}

async function ensureAuthStore() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(authStorePath);
  } catch {
    await fs.writeFile(authStorePath, JSON.stringify(defaultStore, null, 2));
  }
}

export async function readAuthStore() {
  await ensureAuthStore();
  const raw = await fs.readFile(authStorePath, 'utf8');

  try {
    return normalizeStore(JSON.parse(raw));
  } catch {
    return {
      users: [],
      sessions: [],
    };
  }
}

export async function writeAuthStore(store) {
  await ensureAuthStore();
  await fs.writeFile(authStorePath, JSON.stringify(normalizeStore(store), null, 2));
}

export function pruneExpiredSessions(store, now = Date.now()) {
  const activeSessions = store.sessions.filter(
    (session) => new Date(session.expiresAt).getTime() > now
  );
  const changed = activeSessions.length !== store.sessions.length;

  if (changed) {
    store.sessions = activeSessions;
  }

  return changed;
}

export function findUserByEmail(store, email) {
  const normalizedEmail = normalizeEmail(email);
  return store.users.find((user) => normalizeEmail(user.email) === normalizedEmail);
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);

  return `${salt}:${Buffer.from(derivedKey).toString('hex')}`;
}

export async function verifyPassword(password, storedPasswordHash) {
  const [salt, savedHash] = String(storedPasswordHash || '').split(':');

  if (!salt || !savedHash) {
    return false;
  }

  const derivedKey = await scrypt(password, salt, 64);
  const savedHashBuffer = Buffer.from(savedHash, 'hex');
  const derivedKeyBuffer = Buffer.from(derivedKey);

  if (savedHashBuffer.length !== derivedKeyBuffer.length) {
    return false;
  }

  return timingSafeEqual(savedHashBuffer, derivedKeyBuffer);
}

export function createSession(userId) {
  const token = randomBytes(32).toString('hex');
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + sessionTtlMs).toISOString();

  return {
    token,
    session: {
      id: randomUUID(),
      userId,
      tokenHash: createHash('sha256').update(token).digest('hex'),
      createdAt,
      expiresAt,
    },
  };
}

export function findSessionByToken(store, token) {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  return store.sessions.find((session) => session.tokenHash === tokenHash);
}

export function removeSessionByToken(store, token) {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const nextSessions = store.sessions.filter((session) => session.tokenHash !== tokenHash);
  const changed = nextSessions.length !== store.sessions.length;

  if (changed) {
    store.sessions = nextSessions;
  }

  return changed;
}
