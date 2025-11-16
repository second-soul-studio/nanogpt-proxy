#!/usr/bin/env node

import { readFileSync } from 'fs';

import { Environment } from './environment.js';
import { Cryptor } from './cryptor.js';
import { DatabaseHandler } from './databaseHandler.js';

const env = new Environment();
const cryptor = new Cryptor(env.dbEncryptionKey);

const db = new DatabaseHandler().db;

function encrypt(plain) {
    return cryptor.encrypt(plain);
}

function decrypt(cipherBlob) {
    return cryptor.decrypt(cipherBlob);
}

const cmd = process.argv[2];
const email = process.argv[3];
const apiKey = process.argv[4];

const fs = await import('fs');

if (cmd === 'import') {
    const raw = readFileSync(0, 'utf8');
    if (!raw.trim()) {
        console.error('empty stdin');
        process.exit(1);
    }

    let data;
    try {
        data = JSON.parse(raw);
    }
    catch {
        console.error('invalid JSON in stdin');
        process.exit(1);
    }

    const insert = db.prepare('INSERT OR REPLACE INTO users VALUES (?, ?)');
    const importMany = db.transaction((users) => {
        for (const user of users) {
            insert.run(user.email, encrypt(user.api_key));
        }
    });
    importMany(data);
    console.log(`✅ Imported ${data.length} user(s)`);
} else if (cmd === 'add-user') {
    if (!email || !apiKey) {
        console.log('Usage: add-user <email> <apiKey>');
        process.exit(1);
    }
    db.prepare('INSERT OR REPLACE INTO users VALUES (?, ?)').run(email, encrypt(apiKey));
    console.log(`✅ Added/Updated user: ${email}`);
} else if (cmd === 'list') {
    const users = db.prepare('SELECT email, api_key FROM users').all();
    console.log(JSON.stringify(users.map(u => 
        ({ email: u.email, api_key: decrypt(u.api_key) }))));
} else if (cmd === 'del-user') {
    db.prepare('DELETE FROM users WHERE email = ?').run(email);
    console.log(`🗑️ Deleted: ${email}`);
} else {
    console.log(`Usage:
  add-user <email> <apiKey>
  del-user <email>
  list
  import < users.json`);
}
