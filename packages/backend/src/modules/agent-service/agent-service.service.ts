import { Injectable } from '@nestjs/common';

@Injectable()
export class AgentServiceService {
  async execute(task: string) {
    // skeleton
    return { result: 'executed' };
  }
}