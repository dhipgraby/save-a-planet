import { HttpException } from '@nestjs/common/exceptions';
import { HttpStatus } from '@nestjs/common/enums';
import { Injectable } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { GoogleAuthDto, LoginUserDto } from './dto/login-user.dto';
import { hash, compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'lib/common/database/prisma.service';
import { TokenService } from '../email/token.service';
import { sendVerificationEmail } from 'lib/mail/mail';
import {
  ResetPasswordDto,
  EmailActions,
  EmailActionType,
} from './dto/reset-password.dto';
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private tokenService: TokenService,
  ) { }

  async signup(userObject: CreateUserDto) {
    const { password, email, username } = userObject;

    const existingUser = await this.findAll({
      where: {
        OR: [{ email: email }, { username: username }],
      },
    });

    if (existingUser.length) {
      throw new HttpException(
        'User with the same email or name already exists',
        HttpStatus.FORBIDDEN,
      );
    }

    const plainToHash = await hash(password, 10);
    userObject = { ...userObject, password: plainToHash };

    try {
      const newUser = await this.prisma.user.create({
        data: userObject,
      });

      if (newUser) {
        const token = this.generateJwtToken(newUser);
        const data = this.formatLoginResponse(newUser, token);
        return data;
      }
    } catch (error) {
      console.log('Signup error: ', error);
      throw new HttpException(
        'Database error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async googleAuth(googleAuthDto: GoogleAuthDto) {
    const { googleTokenId } = googleAuthDto;

    const ticket = await client.verifyIdToken({
      idToken: googleTokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new HttpException('Invalid Google token', HttpStatus.FORBIDDEN);
    }

    const userEmail = payload.email;

    let findUser = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });
    if (!findUser) {
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await hash(randomPassword, 10);

      findUser = await this.prisma.user.create({
        data: {
          email: userEmail,
          password: hashedPassword,
          username: payload.name || userEmail.split('@')[0],
        },
      });
    }

    await this.prisma.user.update({
      where: { id: findUser.id },
      data: { last_login: new Date().toISOString() },
    });

    return this.findOne({ id: findUser.id });
  }

  async login(userLoginObject: LoginUserDto) {
    const { identifier, password } = userLoginObject;

    const findUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }],
      },
    });

    if (!findUser) {
      return {
        message: 'User not found',
        status: 404,
      };
    }

    const isValidPassword = await compare(password, findUser.password);

    if (!isValidPassword) {
      console.log('invalid credentials');
      throw new HttpException('Invalid credentialss', HttpStatus.FORBIDDEN);
    }

    await this.prisma.user.update({
      where: { id: findUser.id },
      data: { last_login: new Date().toISOString() },
    });

    const token = this.generateJwtToken(findUser);
    const data = this.formatLoginResponse(findUser, token);

    return data;
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email } = resetPasswordDto;
    const findUser = await this.findOne({ email });

    if (!findUser) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return await this.handleUnverifiedEmail(
      email,
      EmailActions.PASSWORD_RESET,
    );
  }

  private async handleUnverifiedEmail(email: string, action: EmailActionType) {
    const tokenExist = await this.tokenService.getVerificationTokenByEmail(
      email,
      action,
    );

    if (tokenExist) {
      const lastVerificationEmailSent = tokenExist.expires_at;
      return await this.tokenService.verifyEmailExpiration(
        lastVerificationEmailSent,
        email,
        action,
      );
    } else {
      const verificationToken = await this.tokenService.generateVerificationToken(email, action);
      await sendVerificationEmail(email, verificationToken.code, action);

      const message = {
        status: 202,
        message: 'Confirmation email sent',
      };
      return message;
    }
  }

  private generateJwtToken(user: any) {
    const payload = { username: user.username, id: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }

  private formatLoginResponse(user: any, token: string) {
    return {
      user: {
        name: user.username,
        email: user.email,
      },
      status: 200,
      message: 'Login successful',
      token,
    };
  }

  async findOne(userWhereUniqueInput: Prisma.UserWhereUniqueInput) {

    const user = await this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });

    if (!user) throw new HttpException('USER NOT FOUND', HttpStatus.NOT_FOUND);

    const token = this.generateJwtToken(user);
    const data = this.formatLoginResponse(user, token);
    return data;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }
}
