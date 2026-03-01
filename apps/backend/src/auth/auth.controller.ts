import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

type AuthRequest = Request & {
  user: {
    userId: number;
    email: string;
  };
};

type RefreshRequest = Request & {
  cookies?: {
    refreshToken?: string;
  };
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiCreatedResponse({ type: AuthResponseDto })
  async signup(@Body() dto: SignupDto, @Res({ passthrough: true }) res: Response) {
    const { authResponse, refreshToken } = await this.authService.signup(dto);
    this.setRefreshTokenCookie(res, refreshToken);
    return authResponse;
  }

  @Post('login')
  @HttpCode(200)
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { authResponse, refreshToken } = await this.authService.login(dto);
    this.setRefreshTokenCookie(res, refreshToken);
    return authResponse;
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token.' })
  async refresh(
    @Req() req: RefreshRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing.');
    }

    const { authResponse, refreshToken: nextRefreshToken } =
      await this.authService.refresh(refreshToken);

    this.setRefreshTokenCookie(res, nextRefreshToken);
    return authResponse;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOkResponse({ type: MeResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid token.' })
  me(@Req() req: AuthRequest) {
    return this.authService.me(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Logged out.' })
  async logout(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.userId);
    this.clearRefreshTokenCookie(res);
    return { message: 'Logged out.' };
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/auth/refresh',
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    const isProduction = process.env.NODE_ENV === 'production';

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/auth/refresh',
    });
  }
}
