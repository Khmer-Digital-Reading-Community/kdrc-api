import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT authentication guard.
 * Attempts to authenticate the request but does NOT fail if no token is present.
 * Sets req.user when a valid token is provided; leaves it undefined otherwise.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const result = (await super.canActivate(context)) as boolean;
      return result;
    } catch {
      // No token or invalid — allow the request to proceed without auth
      return true;
    }
  }

  handleRequest(err: any, user: any) {
    return user || undefined;
  }
}
