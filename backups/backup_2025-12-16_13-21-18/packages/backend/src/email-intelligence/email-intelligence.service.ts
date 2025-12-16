import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailIntelligenceService {
  analyzeEmail(email: string) {
    // skeleton
    return { intelligence: 'analyzed' };
  }
}