import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        console.log('JwtAuthGuard triggered');
        return super.canActivate(context);
    }

    handleRequest(err, user, info) {
        console.log('USER FROM JWT:', user);
        console.log('INFO:', info);

        return user;
    }

}
