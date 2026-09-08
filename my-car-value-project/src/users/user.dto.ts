/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Expose } from 'class-transformer';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email!: string;

  @IsString()
  @IsOptional()
  password!: string;
}

// Response DTO — signup ke DTOs (upar wale) request ka shape define karte hain,
// ye "output" DTO hai jo API RESPONSE ka shape define karta hai — safe/public fields
// (`id`, `email`) hi expose karta hai, `password` jaan-bujh kar shamil nahi kiya.
export class UserDto {
  // @Expose() (class-transformer se) batata hai ki `plainToClass()` ke `excludeExtraneousValues: true`
  // mode me ye field response me SHAMIL rahega. Jis field pe @Expose() nahi lagega
  // (jaise agar humne `password!: string;` yaha likha hota bina @Expose() ke), wo
  // automatically drop ho jaata — SerializeInterceptor isi tarike se password ko chhupata hai.
  @Expose()
  id!: number;

  @Expose()
  email!: string;
}
