import { SetMetadata } from '@nestjs/common';
import { OWNERSHIP_KEY, OwnershipConfig } from '../guards/ownership.guard';

export const RequireOwnership = (config: OwnershipConfig) => SetMetadata(OWNERSHIP_KEY, config);
