import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable,
} from '@nestjs/common';
import { UsersService } from '../users.service';
import { User } from '../user.entity';

// Iska kaam: `@Session()` se milne wale `session.userId` ko poore `User` entity me
// resolve karke `request.currentUser` pe attach kar dena — taaki aage koi bhi
// (`@CurrentUser()` decorator ho ya seedha `@Request() request` inject karke) baar
// baar DB query kiye bina hi current logged-in user use kar sake. `SerializeInterceptor`
// (dekho src/interceptors/serialize.interceptor.ts) ki tarah ye bhi PRE-handler kaam
// karta hai (`next.handle()` call hone se PEHLE), SerializeInterceptor ke ulat jo
// response ko POST-handler transform karta hai.
interface RequestWithSessionAndCurrentUser {
  session: { userId?: number | null };
  currentUser: User | null;
}

@Injectable()
export class CurrentUserInterceptor implements NestInterceptor {
  constructor(private readonly userService: UsersService) {}

  // `intercept` ko `async` banaya kyunki neeche `findOne()` ek Promise return karta hai
  // (dekho users.service.ts) — isse await kiye bina `request.currentUser` seedha Promise
  // object ban jaata (actual `User` nahi), jo TS error TS2339 ke saath-saath ek runtime bug
  // bhi hota (currentUser kabhi resolved user nahi hota).
  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithSessionAndCurrentUser>();
    const { userId } = request.session || {};

    if (userId) {
      const user = await this.userService.findOne(userId);
      request.currentUser = user;
    }
    return next.handle();
  }
}
