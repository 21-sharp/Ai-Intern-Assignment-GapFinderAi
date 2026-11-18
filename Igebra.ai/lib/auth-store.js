import { DatabaseSync } from 'node:sqlite';
import { hash, verify } from '@node-rs/argon2';
import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = process.env.GAPFINDER_DATA_DIR || path.join(process.cwd(), 'data');
const DB_PATH = process.env.GAPFINDER_DB_PATH || path.join(DATA_DIR, 'gapfinder.sqlite');
const COOKIE_NAME = 'gapfinder_session';
const SESSION_DAYS = 7;
let db;

function database() {
  if (db) return db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','teacher','admin')),
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS user_sessions_user_idx ON user_sessions(user_id);
    CREATE INDEX IF NOT EXISTS user_sessions_expiry_idx ON user_sessions(expires_at);
  `);
  return db;
}

export function pingDatabase() {
  return database().prepare('SELECT 1 AS healthy').get()?.healthy === 1;
}

const argonOptions = { algorithm: 2, memoryCost: 65536, timeCost: 3, parallelism: 1, outputLen: 32 };
let dummyHash;

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email, role: row.role, createdAt: row.created_at };
}

export async function createAccount({ name, email, password }) {
  const store = database();
  const id = randomBytes(16).toString('hex');
  const createdAt = new Date().toISOString();
  const passwordHash = await hash(password, argonOptions);
  try {
    store.prepare('INSERT INTO users (id,name,email,password_hash,role,created_at) VALUES (?,?,?,?,?,?)')
      .run(id, name.trim(), email.trim().toLowerCase(), passwordHash, 'student', createdAt);
  } catch (error) {
    if (String(error.message).includes('UNIQUE constraint failed')) return null;
    throw error;
  }
  return publicUser({ id, name: name.trim(), email: email.trim().toLowerCase(), role: 'student', created_at: createdAt });
}

export async function verifyCredentials(email, password) {
  const row = database().prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email.trim().toLowerCase());
  if (!row) {
    // Run a dummy KDF for unknown email to reduce timing-based account discovery.
    dummyHash ||= hash('gapfinder-invalid-account-check', argonOptions);
    await verify(await dummyHash, password).catch(() => false);
    return null;
  }
  let matches = false;
  try { matches = await verify(row.password_hash, password); } catch { matches = false; }
  if (!matches) return null;
  return publicUser(row);
}

export function issueSession(userId) {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const store = database();
  store.prepare('DELETE FROM user_sessions WHERE expires_at <= ?').run(Date.now());
  store.prepare('INSERT INTO user_sessions (token_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)')
    .run(tokenHash, userId, expiresAt, new Date().toISOString());
  return { token, expiresAt };
}

export function getSession(token) {
  if (!token) return null;
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const row = database().prepare(`SELECT users.*, user_sessions.expires_at FROM user_sessions
    JOIN users ON users.id = user_sessions.user_id WHERE user_sessions.token_hash = ?`).get(tokenHash);
  if (!row || row.expires_at <= Date.now()) {
    database().prepare('DELETE FROM user_sessions WHERE token_hash = ?').run(tokenHash);
    return null;
  }
  return publicUser(row);
}

export function revokeSession(token) {
  if (!token) return;
  database().prepare('DELETE FROM user_sessions WHERE token_hash = ?').run(createHash('sha256').update(token).digest('hex'));
}

export const sessionCookieName = COOKIE_NAME;
export const sessionMaxAge = SESSION_DAYS * 24 * 60 * 60;

export function sessionCookie(token) {
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${sessionMaxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}
