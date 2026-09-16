import { CanActivate, ExecutionContext } from '@nestjs/common';

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
export class AuthGuard implements CanActivate {
  // Return type `: boolean` explicitly likha — `CanActivate.canActivate()` interface
  // isi shape ka return maangta hai, isliye ye contract yahi declaration pe saaf dikh
  // jaata hai (aage se galat return type likhte hi turant error milega).
  canActivate(context: ExecutionContext): boolean {
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
