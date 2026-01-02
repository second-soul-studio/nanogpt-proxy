import { Body, Controller, Delete, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { DeleteUserDto } from '../dtos/delete-user.dto';
import { PaginationQueryDto } from '@nanogpt-monorepo/core/dist/pagination/pagination-query.dto';
import { PageDto } from '@nanogpt-monorepo/core/dist/pagination/page.dto';
import { UsersDto } from '../dtos/users.dto';

@Controller('v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  async createUser(@Body() dto: CreateUserDto): Promise<void> {
    return await this.users.createUser(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  async listUsers(@Query() query: PaginationQueryDto): Promise<PageDto<UsersDto>> {
    return this.users.listUsers(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @Put()
  async updateUser(@Body() dto: UpdateUserDto): Promise<void> {
    return await this.users.updateUser(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @Put('bulk')
  async updateUsers(@Body() dtos: UpdateUserDto[]): Promise<void> {
    await Promise.all(dtos.map((dto) => this.users.updateUser(dto)));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @Put('/apikey')
  async upsertKey(@Body() dto: UpdateUserDto): Promise<void> {
    return await this.users.upsertKey(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete()
  async deleteUser(@Body() dto: DeleteUserDto): Promise<void> {
    return await this.users.deleteUser(dto);
  }
}
