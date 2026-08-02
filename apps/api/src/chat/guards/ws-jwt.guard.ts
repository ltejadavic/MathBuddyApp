import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const token = this.extractTokenFromSocket(client);

    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'super-secret-default-key-for-dev',
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Attach user to socket data so we can access it in the gateway handlers
      client.data.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private extractTokenFromSocket(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
      return authHeader.split(' ')[1];
    }
    const token = client.handshake.auth?.token;
    if (token) return token;

    return null;
  }
}
