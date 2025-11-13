import sqlite from 'better-sqlite3';

const DB_PATH = '../keys.db';

export const db = sqlite(DB_PATH);
