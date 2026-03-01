import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // JwtStrategy에서 반환한 유저 정보는 request.user에 담깁니다.
    if (data) {
      return request.user?.[data];
    }
    return request.user;
  },
);
