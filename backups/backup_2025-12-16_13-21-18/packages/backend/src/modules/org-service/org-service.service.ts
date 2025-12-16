import { Injectable } from '@nestjs/common';

@Injectable()
export class OrgServiceService {
  async getOrganizations() {
    // skeleton
    return [{ id: 1, name: 'Skeleton Org' }];
  }

  async createOrganization(name: string) {
    // skeleton
    return { id: 2, name };
  }
}