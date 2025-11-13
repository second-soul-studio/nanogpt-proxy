#!/usr/bin/env node
import sqlite from 'better-sqlite3';
import dotenv from 'dotenv';
import { encrypt } from './utilities/crypto.js';

dotenv.config();

const db = sqlite('keys.db');
const key = process.env.DB_ENCRYPTION_KEY;
if (!key) throw new Error('Missing DB_ENCRYPTION_KEY in env');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    api_key TEXT NOT NULL
  );
`);

const cmd = process.argv[2];
const email = process.argv[3];
const apiKey = process.argv[4];

if (cmd === 'add-user') {
    if (!email || !apiKey) {
        console.log('Usage: add-user <email> <apiKey>');
        process.exit(1);
    }
    db.prepare('INSERT OR REPLACE INTO users VALUES (?, ?)').run(email, encrypt(apiKey));
    console.log(`✅ Added/Updated user: ${email}`);
} else if (cmd === 'list') {
    console.log(db.prepare('SELECT email FROM users').all());
} else if (cmd === 'del-user') {
    db.prepare('DELETE FROM users WHERE email = ?').run(email);
    console.log(`🗑️ Deleted: ${email}`);
} else {
    console.log(`Usage:
  add-user <email> <apiKey>
  del-user <email>
  list`);
}
