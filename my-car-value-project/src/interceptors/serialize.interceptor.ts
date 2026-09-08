import {
  UseInterceptors,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserDto } from 'src/users/user.dto';

// Interceptor — response bahar jaane se PEHLE usse modify karne ka NestJS ka mechanism.
// Request lifecycle me iski jagah: Middleware → Guard → Interceptor (pre) → Pipe →
// Controller Handler → Interceptor (post, yahi hum use kar rahe hain) → Exception Filter.
//
// Iska use "serialization" ke liye ho raha hai — matlab controller/service jo bhi poora
// `User` entity object return karta hai (jisme `password` bhi included hota hai), usse
// response bhejne se pehle safe/public shape (`UserDto` — sirf `id` aur `email`) me convert
// karna, taaki galti se bhi password client tak leak na ho.
export class SerializeInterceptor implements NestInterceptor {
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
        // controller se aaya `User` entity/object) ko `UserDto` class instance me convert karta hai.
        // `excludeExtraneousValues: true` ka matlab hai: SIRF wahi fields result me rahenge
        // jinpe target class (`UserDto`) me `@Expose()` decorator laga ho — baaki sab (jaise
        // `password`) automatically DROP ho jaate hain, chahe source object me wo present ho.
        return plainToClass(UserDto, data, {
          excludeExtraneousValues: true,
        });
        // // run something before the response is send out.
        // console.log('i am running before response is sent out', data);
      }),
    );
  }
}

// NOTE (limitation): Ye interceptor abhi hardcoded hai `UserDto` pe — kisi doosri entity
// (jaise `Report`) ke response ko serialize karna ho to ye reuse nahi ho sakta. Reusable
// banane ke liye constructor me target DTO class ko parameter ke roop me lena chahiye
// (e.g. `new SerializeInterceptor(UserDto)`), jo is project ka ek aage ka improvement hai.
