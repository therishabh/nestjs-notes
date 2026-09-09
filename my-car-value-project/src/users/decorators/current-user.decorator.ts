import { createParamDecorator } from '@nestjs/common';

// createParamDecorator() — apna custom PARAMETER decorator banane ka NestJS tarika
// (`@Body()`, `@Session()`, `@Param()` jaise built-in decorators bhi isi tarah bane
// hote hain). Iska factory function do arguments leta hai: `data` (decorator ko call
// karte waqt pass kiya gaya argument, e.g. `@CurrentUser('email')`) aur `context`
// (poora `ExecutionContext` — jisse request/response nikaale ja sakte hain). Abhi
// dono use nahi ho rahe (isliye signature me likhe hi nahi — TS/ESLint dono ko
// "unused parameter" error nahi aata), kyunki ye sirf ek SCAFFOLD step hai — pehle
// sirf itna confirm karna tha ki `@CurrentUser()` controller me sahi se wire ho raha
// hai. Real version me `context.switchToHttp().getRequest()` se request nikaal kar
// `request.session.userId` se actual logged-in user return karna hoga.
export const CurrentUser = createParamDecorator(() => {
  return 'hi there !';
});
