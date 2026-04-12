import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    try {
      const result = super.canActivate(context);
      if (result instanceof Promise) {
        return result.catch(() => true);
      }
      return result;
    } catch {
      return true;
    }
  }

  handleRequest(_err: any, user: any) {
    // Don't throw on missing/invalid token — just return null
    return user || null;
  }
}
