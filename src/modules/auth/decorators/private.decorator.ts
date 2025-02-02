import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/jwt-auth.guard';

export const IS_PUBLIC_DECORATOR_KEY = 'isPublic';
export const Private = (): ReturnType<typeof applyDecorators> => {
  return applyDecorators(
    SetMetadata(IS_PUBLIC_DECORATOR_KEY, false),
    UseGuards(AuthGuard),
  );
};
