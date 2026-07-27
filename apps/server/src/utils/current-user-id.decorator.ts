import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { USER_ID_HEADER } from './constants';

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const userId = request.headers[USER_ID_HEADER];

    if (!userId) {
      throw new BadRequestException(`${USER_ID_HEADER} header is required`);
    }

    return userId;
  },
);
