// ========================================================
// FluentUp - Current User Decorator
// ========================================================
// Yeh custom decorator controller routes ke andar authenticated
// user ka data direct inject karta hai bina manual request parsing ke:
// Usage: @CurrentUser() user: User
// ========================================================

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    // Current HTTP request object nikaalna
    const request = ctx.switchToHttp().getRequest();
    // FirebaseAuthGuard dwara attach kiya gaya Neon DB user return karna
    return request.user;
  },
);
