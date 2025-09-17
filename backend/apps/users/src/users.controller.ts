import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Request,
} from '@nestjs/common';
import { UsersService } from './services/users.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'lib/common/auth/jwt-auth.guard';
import { BalancesService } from 'lib/common/services/balances.service';

@ApiBearerAuth()
@ApiTags('User Profile')
@Controller('user')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly balancesService: BalancesService,
  ) { }

  @Get()
  getHello(): string {
    return this.usersService.getHello();
  }

  @UseGuards(JwtAuthGuard)
  @Get('get-balance')
  getBalance(@Request() req) {
    const userId = req.user.id;
    return this.balancesService.getUserBalance(Number(userId));
  }
}
