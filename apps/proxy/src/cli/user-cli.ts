#!/usr/bin/env node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CryptorService, UserRepository } from '@nanogpt-monorepo/core';

interface ImportUser {
  email: string;
  api_key: string;
}

async function readStdin(): Promise<string> {
  return await new Promise<string>((resolve) => {
    let data = '';

    process.stdin.on('data', (chunk: Buffer) => {
      data += chunk.toString('utf8');
    });

    process.stdin.on('end', () => resolve(data));
  });
}

function parseImportUsers(raw: string): ImportUser[] {
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('Invalid import format: expected an array');
  }

  return parsed.map((item) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error('Invalid import format: expected objects');
    }

    const { email, api_key } = item as { email?: unknown; api_key?: unknown };

    if (typeof email !== 'string' || typeof api_key !== 'string') {
      throw new Error('Invalid import format: email/api_key must be strings');
    }

    return { email, api_key };
  });
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const cryptor = app.get(CryptorService);
  const users = app.get(UserRepository);

  const cmd = process.argv[2];
  const email = process.argv[3];
  const apiKey = process.argv[4];

  switch (cmd) {
    case 'add-user': {
      if (!email || !apiKey) {
        console.log('Usage: add-user <email> <apiKey>');
        process.exit(1);
      }
      const encrypted = cryptor.encrypt(apiKey);
      await users.upsertApiKey(email, encrypted);
      console.log(`✅ Added/Updated user: ${email}`);
      break;
    }

    case 'del-user': {
      if (!email) {
        console.log('Usage: del-user <email>');
        process.exit(1);
      }
      await users.deleteUser(email);
      console.log(`🗑️ Deleted user: ${email}`);
      break;
    }

    case 'list': {
      const all = await users.getAllUsers();
      console.log(
        JSON.stringify(
          all.map((u) => ({
            email: u.email,
            api_key: cryptor.decrypt(u.api_key),
          })),
          null,
          2,
        ),
      );
      break;
    }

    case 'import': {
      const raw = await readStdin();
      const parsed = parseImportUsers(raw);

      for (const u of parsed) {
        await users.upsertApiKey(u.email, cryptor.encrypt(u.api_key));
      }

      console.log(`✅ Imported ${parsed.length} users`);
      break;
    }

    default: {
      console.log(`Usage:
  add-user <email> <apiKey>
  del-user <email>
  list
  import < users.json`);
      break;
    }
  }

  await app.close();
}

void bootstrap();
