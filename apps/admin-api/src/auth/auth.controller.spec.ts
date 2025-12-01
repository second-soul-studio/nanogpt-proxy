import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LoginDto } from '../dtos/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    login: jest.Mock;
    refresh: jest.Mock;
    logout: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn().mockResolvedValue(true),
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should call AuthService.login and return the result', async () => {
    const dto: LoginDto = {
      email: 'admin@example.com',
      password: 'secret',
      accessToken: '',
    };

    const expected = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      email: 'admin@example.com',
      role: 'ADMIN',
    };

    authService.login.mockResolvedValue(expected);

    const result = await controller.login(dto);

    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('should call AuthService.refresh and return the result', async () => {
    const refreshToken = 'some-refresh-token';

    const expected = {
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    };

    authService.refresh.mockResolvedValue(expected);

    const result = await controller.refresh(refreshToken);

    expect(authService.refresh).toHaveBeenCalledWith(refreshToken);
    expect(result).toEqual(expected);
  });

  it('should call AuthService.logout and return success true', async () => {
    const accessToken = 'some-access-token';

    authService.logout.mockResolvedValue(undefined);

    const result = await controller.logout(accessToken);

    expect(authService.logout).toHaveBeenCalledWith(accessToken);
    expect(result).toEqual({ success: true });
  });
});
