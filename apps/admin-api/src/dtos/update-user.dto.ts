export class UpdateUserDto {
  email: string;
  password?: string;
  api_key?: string;
  role?: string;
  enabled?: boolean;
}
