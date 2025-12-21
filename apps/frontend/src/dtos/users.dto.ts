export type UserRole = 'USER' | 'ADMIN';

export type UsersDto = {
  enabled: boolean;
  email: string;
  password: string;
  api_key: string;
  role: UserRole;
};
