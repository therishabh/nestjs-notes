import { SetMetadata } from '@nestjs/common';

// `AuthGuard` (dekho src/users/guards/AuthGuard.ts) ab `APP_GUARD` se GLOBALLY register
// hai — matlab default se poori application "protected" hai (login required), README ke
// Step 21 "senior notes" me discuss kiya gaya "fail-closed" pattern. Kuch routes
// (signup, signin, root health-check route) genuinely public rehne chahiye — unhe explicitly
// "skip karo" bolne ka tareeka yahi `@Public()` decorator hai.
//
// `IS_PUBLIC_KEY` sirf ek plain string hai jo metadata store karne/read karne ke beech
// "shared key" ka kaam karta hai — `SetMetadata()` isi key pe `true` likh deta hai, aur
// `AuthGuard` andar `Reflector` se isी key padh kar check karta hai.
export const IS_PUBLIC_KEY = 'isPublic';

// `SetMetadata(key, value)` — kisi bhi route handler (method) ya poori controller class
// pe custom metadata "attach" kar deta hai, jo runtime pe `Reflector` (dekho AuthGuard) se
// wapas padha ja sakta hai. `@Body()`/`@Session()` jaisे decorators request se data
// NIKAALTE hain, jabki `SetMetadata()`-based decorators class/method pe khud data
// "chipka" dete hain — dono bilkul alag mechanism hain.
//
// Istemal: `@Public()` `@Post('/signup')` route ke upar laga do (ya poori class ke upar,
// agar poora controller hi public rakhna ho).
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
