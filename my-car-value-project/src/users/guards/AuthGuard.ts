import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

// `Guard` — request lifecycle me sabse pehle chalne wala checkpoint hai (Middleware ke
// baad, Interceptor/Pipe/Handler se PEHLE — poora order README ke "Interview Prep" section
// me hai). Iska kaam sirf ek fixed sawal ka jawab dena hota hai: "isse aage jaane doon ya
// nahi?" — koi response modify nahi karta (wo Interceptor ka kaam hai), sirf **allow/deny**
// decide karta hai.
//
// `CanActivate` interface implement karna zaroori hai — iska `canActivate()` method
// `boolean` (ya `Promise<boolean>` / `Observable<boolean>`, jab check async ho, jaise
// DB/API call) return karta hai. `true` → request aage badhne di jaati hai; `false` →
// Nest khud automatically `403 Forbidden` throw kar deta hai, hume khud koi
// `ForbiddenException` throw karne ki zaroorat nahi (jaise `ValidationPipe` khud `400`
// throw kar deta hai, waisa hi yaha `403` ke liye hai).
//
// Ab ye guard `app.module.ts` me `APP_GUARD` se GLOBALLY register hai (README Step 21 ke
// "senior notes" wala "fail-closed" fix) — matlab poori application by-default "login
// required" hai, sirf `@Public()` decorator se mark ki gayi routes (signup, signin, root
// health-check) iske bahar hain. Interesting baat: is guard ki file khud `src/users/guards/`
// (ek feature folder) ke andar hai, phir bhi poori app pe apply hoti hai — bilkul waisa
// hi jaisa [Step 20](../../../README.md#step-20-currentuserinterceptor-ko-app_interceptor-se-global-banaya)
// me `CurrentUserInterceptor` ke saath dekha tha (jaha likha, wo scope decide nahi karta).
@Injectable()
export class AuthGuard implements CanActivate {
  // `Reflector` — Nest ka built-in utility jo kisi route handler/class pe `SetMetadata()`
  // (dekho `@Public()`, src/users/decorators/public.decorator.ts) se laga metadata wapas
  // padhne deta hai. Ye ek globally-available provider hai (`@nestjs/core` se) — kisi bhi
  // module ke `providers` me explicitly register karne ki zaroorat nahi padti, isliye
  // `AuthGuard` ko `AppModule` (ya kisi bhi module) me `APP_GUARD` se register karna
  // "free" hai — `CurrentUserInterceptor` (Step 20) ke ulat, jiski `UsersService`
  // dependency sirf `UsersModule` provide karta tha.
  constructor(private readonly reflector: Reflector) {}

  // Return type `: boolean` explicitly likha — `CanActivate.canActivate()` interface
  // isi shape ka return maangta hai, isliye ye contract yahi declaration pe saaf dikh
  // jaata hai (aage se galat return type likhte hi turant error milega).
  canActivate(context: ExecutionContext): boolean {
    // `getAllAndOverride()` do jagah check karta hai — pehle METHOD-level (`context.getHandler()`,
    // e.g. `@Public()` seedha `@Post('/signup')` route pe), agar wahan na mile to CLASS-level
    // (`context.getClass()`, e.g. poori controller pe `@Public()`). Method-level value class-level
    // ko "override" kar deti hai (isi wajah se naam `...AndOverride` hai) — taaki kal agar kisi
    // poori class ko `@Public()` kar diya jaaye, to uska ek specific route method-level
    // `@Public()` na lagakar phir bhi protected rakha ja sake.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      session: {
        userId?: null | number;
      };
    }>();
    // `session.userId` khud `number | null | undefined` hai (ek DB id, koi `true`/`false`
    // nahi) — isliye `!!` se explicit `boolean` me convert kiya. Bina `!!` ke TypeScript
    // error deta: `Type 'number | null' is not assignable to type 'boolean | ...'`
    // (`canActivate()` ka return type `CanActivate` interface se strictly bandha hai).
    // `request.session?.userId` (optional chaining) defensive hai — is route ke `AuthSession`
    // type me `session` khud optional nahi hai, lekin agar kabhi `cookie-session`
    // middleware se pehle hi ye guard chal jaaye to `session` `undefined` bhi ho sakta hai.
    return !!request.session?.userId;
  }
}
