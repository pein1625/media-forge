import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  tokens: TokenPair;
}

@Injectable()
export class AuthService {
  private redis: Redis;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    configService: ConfigService,
  ) {
    const redisHost = configService.get('REDIS_HOST') || 'localhost';
    const redisPort = parseInt(configService.get('REDIS_PORT') || '6379', 10);
    this.redis = new Redis({ host: redisHost, port: redisPort });
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const user = await this.usersService.create(dto);
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await this.usersService.validatePassword(user, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async generateTokens(user: User): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();

    const refreshTokenTtl = 7 * 24 * 60 * 60; // 7 days
    await this.redis.setex(
      `refresh_token:${refreshToken}`,
      refreshTokenTtl,
      JSON.stringify({
        userId: user.id,
        email: user.email,
      }),
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const tokenData = await this.redis.get(`refresh_token:${refreshToken}`);
    if (!tokenData) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const { userId } = JSON.parse(tokenData);
    const user = await this.usersService.findById(userId);

    // Invalidate old refresh token
    await this.redis.del(`refresh_token:${refreshToken}`);

    return this.generateTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.redis.del(`refresh_token:${refreshToken}`);
  }

  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  private sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
