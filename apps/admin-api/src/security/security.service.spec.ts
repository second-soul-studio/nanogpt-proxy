import { SecurityService } from './security.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('SecurityService', () => {
  let service: SecurityService;

  beforeEach(() => {
    service = new SecurityService();
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password with bcrypt using 12 rounds', async () => {
      const plain = 'my-secret';
      const hashed = 'hashed-secret';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashed);

      const result = await service.hashPassword(plain);

      expect(bcrypt.hash).toHaveBeenCalledTimes(1);
      expect(bcrypt.hash).toHaveBeenCalledWith(plain, 12);
      expect(result).toBe(hashed);
    });
  });

  describe('verifyPassword', () => {
    it('should return true when bcrypt.compare resolves true', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.verifyPassword('plain', 'hash');

      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledWith('plain', 'hash');
      expect(result).toBe(true);
    });

    it('should return false when bcrypt.compare resolves false', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.verifyPassword('plain', 'hash');

      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledWith('plain', 'hash');
      expect(result).toBe(false);
    });
  });
});
