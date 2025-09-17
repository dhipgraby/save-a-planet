import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersController } from './users.controller';
import { UsersService } from './services/users.service';
import { PrismaService } from 'lib/common/database/prisma.service';
import { UserService as AuthService } from 'apps/auth/src/users/users.service';
import { TokenService } from 'apps/auth/src/email/token.service';
import { BalancesService } from 'lib/common/services/balances.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    PrismaService,
    AuthService,
    TokenService,
    BalancesService
  ],
  imports: [
    JwtModule.register({}) // Add your config here if needed
  ],
})
export class UsersModule { }
