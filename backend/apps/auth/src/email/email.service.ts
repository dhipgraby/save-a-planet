import { Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';
import { PrismaService } from 'lib/common/database/prisma.service';
import { TokenService } from './token.service';
import {
  ConfirmResetPasswordDto,
  EmailActions,
} from '../users/dto/reset-password.dto';
import { UserService } from '../users/users.service';

@Injectable()
export class EmailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
  ) { }

  passwordResetVerification = async (
    changePasswordDto: ConfirmResetPasswordDto,
  ) => {
    const existingToken = await this.tokenService.getVerificationTokenByToken(
      changePasswordDto.token,
      EmailActions.PASSWORD_RESET,
    );

    if (!existingToken) return { status: 404, error: 'Token does not exist!' };

    const hasExpired = new Date(existingToken.expires_at) < new Date();

    if (hasExpired) return { status: 404, error: 'Token has expired!' };

    const existingUser = await this.prisma.user.findFirst({
      where: { email: existingToken.email },
    });

    if (!existingUser) return { status: 404, error: 'Email does not exist!' };

    await this.prisma.emailCode.delete({
      where: { id: existingToken.id, action: EmailActions.PASSWORD_RESET },
    });

    const plainToHash = await hash(changePasswordDto.password, 10);

    await this.userService.updateUser({
      data: { password: plainToHash },
      where: { id: existingUser.id },
    });

    return { status: 200, success: 'Password changed successfully!' };
  };
}
