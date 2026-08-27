import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string;
    const validKey = this.configService.getOrThrow<string>('N8N_API_KEY');

    if (!apiKey || apiKey !== validKey) {
      throw new UnauthorizedException('API key inválida');
    }
    return true;
  }
}
