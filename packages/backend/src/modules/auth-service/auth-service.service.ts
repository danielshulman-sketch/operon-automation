import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthServiceService {
  async login(username: string, password: string) {
    // skeleton code for auth
    return { token: 'skeleton-token' };
  }
}