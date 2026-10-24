import { SetMetadata } from '@nestjs/common';

export const ALLOW_DURING_PASSWORD_CHANGE = 'allowDuringPasswordChange';

export const AllowDuringPasswordChange = () =>
  SetMetadata(ALLOW_DURING_PASSWORD_CHANGE, true);
