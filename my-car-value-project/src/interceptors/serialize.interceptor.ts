import {
  UseInterceptors,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// ---- Serialize() ----
// Ye ek "decorator factory" hai — ek function jo khud ek decorator RETURN karta hai.
// Isse controller me likhna hota hai: `@Serialize(UserDto)`, jo internally
// `@UseInterceptors(new SerializeInterceptor(UserDto))` jaisa hi kaam karta hai —
// bas likhne me chhota/readable syntax milta hai, aur DTO parameterized ho jaata hai.
//
// Ye woh improvement hai jo pehle ek "known limitation" ke roop me note kiya gaya tha —
// pehle `SerializeInterceptor` hardcoded `UserDto` pe based tha, isliye kisi doosri
// entity (jaise `Report`) ke response ko serialize nahi kar sakta tha. Ab constructor
// me DTO class parameter ke roop me le kar isse REUSABLE bana diya gaya —
// `@Serialize(UserDto)`, `@Serialize(ReportDto)` dono kaam karenge.
export function Serialize(dto: any) {
  return UseInterceptors(new SerializeInterceptor(dto));
}

// Interceptor — response bahar jaane se PEHLE usse modify karne ka NestJS ka mechanism.
// Request lifecycle me iski jagah: Middleware → Guard → Interceptor (pre) → Pipe →
// Controller Handler → Interceptor (post, yahi hum use kar rahe hain) → Exception Filter.
//
// Iska use "serialization" ke liye ho raha hai — matlab controller/service jo bhi poora
// entity object return karta hai (jisme sensitive fields jaise `password` bhi included
// ho sakte hain), usse response bhejne se pehle safe/public shape (jo DTO `Serialize()`
// ko diya gaya) me convert karna, taaki galti se bhi wo fields client tak leak na ho.
export class SerializeInterceptor implements NestInterceptor {
  // `private dto: any` — constructor property shorthand hai (TypeScript feature):
  // `private` likhne se ye automatically ek class property (`this.dto`) bhi ban jaata hai,
  // alag se `this.dto = dto;` likhne ki zaroorat nahi. Yehi `dto` neeche `intercept()` me
  // `plainToClass(this.dto, ...)` ke through use hota hai — yahi cheez interceptor ko
  // reusable banati hai (har route apna alag DTO pass kar sakta hai).
  constructor(private dto: any) {}

  // `intercept()` NestJS khud call karta hai — 2 jagah kaam kar sakta hai:
  //   1. Controller handler CHALNE SE PEHLE (`next.handle()` call hone se pehle) — abhi yaha unused hai.
  //   2. Controller handler ke response ko `next.handle()` se milne wale Observable pe `.pipe()`
  //      lagakar TRANSFORM karke — yahi hum kar rahe hain neeche.
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    // console.log('i am running before the handler', context);

    // next.handle() controller handler ko actually chalata hai aur uska return value
    // ek RxJS Observable ke roop me deta hai — Nest ke andar response streaming
    // Observables se hi handle hoti hai (chahe controller sync value ya Promise hi return kare)
    return next.handle().pipe(
      // map() operator Observable se aane wale data ko transform karta hai — response
      // client tak jaane se pehle yahi final chance hai usse badalne ka
      map((data: any) => {
        // plainToClass(): class-transformer ka function jo ek plain object (`data` — yaha
        // controller se aaya entity/object) ko `this.dto` (jo class caller ne Serialize()
        // ko pass ki thi, e.g. `UserDto`) ke instance me convert karta hai.
        // `excludeExtraneousValues: true` ka matlab hai: SIRF wahi fields result me rahenge
        // jinpe target class (`this.dto`) me `@Expose()` decorator laga ho — baaki sab (jaise
        // `password`) automatically DROP ho jaate hain, chahe source object me wo present ho.
        //
        // IMPORTANT: yaha `this.dto` use karna hi is interceptor ko reusable banata hai —
        // agar galti se yaha hardcoded `UserDto` likh dete (jaisa pehle tha), to `Serialize()`
        // ko koi bhi doosra DTO pass karne ka koi fayda na hota, hamesha `UserDto` hi apply hota.
        return plainToClass(this.dto, data, {
          excludeExtraneousValues: true,
        });
        // // run something before the response is send out.
        // console.log('i am running before response is sent out', data);
      }),
    );
  }
}
