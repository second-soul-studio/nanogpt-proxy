import { CreateUserDto } from './create-user.dto';

export class DeleteUserDto implements Pick<CreateUserDto, 'email'> {
  email: string;
}
