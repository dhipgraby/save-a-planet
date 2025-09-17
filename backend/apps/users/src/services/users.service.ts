import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {

  getHello(): string {
    return 'Users Api is status 200!';
  }
}
