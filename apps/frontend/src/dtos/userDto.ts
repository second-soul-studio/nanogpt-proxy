export type UserRole = 'USER' | 'ADMIN';

export type UserDto = {
  enabled: boolean;
  email: string;
  password: string;
  api_key: string;
  role: UserRole;
};
