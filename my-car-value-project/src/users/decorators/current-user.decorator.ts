import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../user.entity';

// `getRequest()` types its return as `any` by default — passing this generic gives
// `request.session`/`request.currentUser` real types so ESLint's
// no-unsafe-assignment/member-access rules stop firing (same `userId?: number | null`
// shape as `AuthSession` in users.controller.ts). `currentUser` yaha isliye add kiya
// gaya kyunki `CurrentUserInterceptor` (dekho src/users/interceptors/current-user.interceptor.ts)
// request pe ye field khud set karta hai, before is decorator ka code chalta hai.
export interface RequestWithSession {
  session: { userId?: number | null };
  currentUser: User | null;
}

// createParamDecorator() — apna custom PARAMETER decorator banane ka NestJS tarika
// (`@Body()`, `@Session()`, `@Param()` jaise built-in decorators bhi isi tarah bane
// hote hain). Iska factory function do arguments leta hai: `data` (decorator ko call
// karte waqt pass kiya gaya argument, e.g. `@CurrentUser('email')`) aur `context`
// (poora `ExecutionContext` — jisse request/response nikaale ja sakte hain).
//
// Pehle ye sirf ek SCAFFOLD tha (hardcoded `'hi there !'` return karta tha) — sirf itna
// confirm karna tha ki `@CurrentUser()` controller me sahi se wire ho raha hai. Ab
// `context.switchToHttp().getRequest()` se poora request nikaal kar `request.currentUser`
// return kar rahe hain — jo value waha se aati hai wo `CurrentUserInterceptor` ne
// request lifecycle me isse PEHLE hi set kar di hoti hai (session ke `userId` se DB
// lookup karke). Isliye `@CurrentUser()` khud koi DB call nahi karta, bas interceptor
// ka kaam kiya hua result read karta hai — controller me `@CurrentUser() user: User`
// likhne se seedha logged-in `User` mil jaata hai.
export const CurrentUser = createParamDecorator(
  (data: never, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<RequestWithSession>();
    // Debug ke liye chhoda gaya hai (wiring confirm karne wale scaffold step se) —
    // functionality ke liye zaroori nahi, safe hai hatana.
    console.log(request);
    return request.currentUser;
  },
);
