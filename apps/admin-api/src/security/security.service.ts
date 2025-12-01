import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SecurityService {
  private readonly rounds = 12;

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
