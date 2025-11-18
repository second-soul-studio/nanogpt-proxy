#!/usr/bin/env node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CryptorService, UserRepository } from '@nanogpt-monorepo/core';

async function bootstrap() {
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
      await users.saveUser({ email, api_key: encrypted });
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
      const raw = await new Promise<string>((res) => {
        let data = '';
        process.stdin.on('data', (chunk) => (data += chunk));
        process.stdin.on('end', () => res(data));
      });

      const parsed = JSON.parse(raw);
      for (const u of parsed) {
        await users.saveUser({
          email: u.email,
          api_key: cryptor.encrypt(u.api_key),
        });
      }

      console.log(`✅ Imported ${parsed.length} users`);
      break;
    }

    default:
      console.log(`Usage:
  add-user <email> <apiKey>
  del-user <email>
  list
  import < users.json`);
  }

  await app.close();
}

bootstrap();
