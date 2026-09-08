import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Put,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './user.dto';
import { UsersService } from './users.service';
// `Serialize` custom decorator hai (Serialize() function jo @UseInterceptors() ko khud
// wrap karta hai) — isliye ab @UseInterceptors()/SerializeInterceptor seedha import
// karne ki zaroorat nahi, sirf `Serialize` hi kaafi hai
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { UserDto } from 'src/users/user.dto';
// AuthService — signup ka poora workflow (duplicate-email check + password hashing)
// yahi handle karta hai, dekho src/users/auth.service.ts
import { AuthService } from './auth.service';

// @Controller('auth') is class ke saare routes ke aage `/auth` prefix laga deta hai
// (isliye neeche wala route asal me `/auth/signup` pe hit hota hai)
@Controller('auth')
export class UsersController {
  // Dono services inject kiye — UsersService abhi bhi findUser/findAllUsers/update/remove
  // ke liye direct use ho raha hai, lekin signup ab AuthService ko delegate hota hai
  // (Nest DI container dono ko khud instantiate karke de deta hai, users.module.ts ke
  // `providers: [UsersService, AuthService]` array me registered hone ki wajah se)
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  // POST /auth/signup — naya user create karne ka endpoint
  @Post('/signup')
  @Serialize(UserDto)
  create(@Body() bodyData: CreateUserDto) {
    // @Body() poore request body ko `CreateUserDto` me convert karta hai
    // main.ts me lagaya gaya global ValidationPipe request aane se pehle hi
    // `email`/`password` ko CreateUserDto ke decorators (@IsEmail, @IsString) se validate kar chuka hota hai —
    // agar validation fail ho to controller ka code chalta hi nahi, seedha 400 error chala jaata hai
    //
    // Pehle yaha seedha `usersService.create()` call hota tha — ab `authService.signup()`
    // call hota hai, jo internally duplicate-email check karta hai, password ko hash karta
    // hai, aur PHIR `usersService.create()` ko call karta hai. Controller ko is internal
    // detail se koi matlab nahi — controller sirf "signup karo" bolta hai, KAISE hota hai
    // wo AuthService ki responsibility hai (separation of concerns).
    //
    // authService.signup() ek Promise<User> return karta hai — isliye yaha `return` kiya,
    // taaki Nest is Promise ko resolve karke response body me saved user bhej de, warna
    // client ko empty response milta. `@Serialize(UserDto)` bhi laga hai, isliye response
    // me `password` (chahe ab wo hashed hi kyun na ho) kabhi client tak nahi jaayega.
    return this.authService.signup(bodyData.email, bodyData.password);
  }

  // @Serialize(UserDto) — custom decorator (dekho src/interceptors/serialize.interceptor.ts)
  // jo internally `@UseInterceptors(new SerializeInterceptor(UserDto))` lagata hai.
  // Response jaane se pehle poore `User` entity (jisme `password` bhi hota hai) ko
  // `UserDto` shape (sirf `id`, `email`) me convert kar deta hai — password kabhi client
  // tak nahi pahunchta. Method-level lagaya hai, isliye sirf yahi route protect hai —
  // `create`/`update`/`remove` abhi bhi raw entity return karte hain (known gap, README me documented)
  @Serialize(UserDto)
  @Get('/:id')
  async findUser(@Param('id') id: string) {
    const user = await this.usersService.findOne(parseInt(id));
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return user;
  }

  // Yaha bhi @Serialize(UserDto) — kyunki `find()` ek array of users return karta hai,
  // `plainToClass()` khud detect kar leta hai ki input array hai aur har element ko
  // individually `UserDto` me convert kar deta hai (poore array pe ek baar call karne se
  // hume manually `.map()` nahi likhna pada)
  @Serialize(UserDto)
  @Get()
  findAllUsers(@Query('email') email: string) {
    return this.usersService.find(email);
  }

  @Put('/:id')
  updateUserCompleteInfo(
    @Param('id') id: string,
    @Body() bodyData: UpdateUserDto,
  ) {
    return this.usersService.update(parseInt(id), bodyData);
  }

  @Delete('/:id')
  removeUser(@Param('id') id: string) {
    return this.usersService.remove(parseInt(id));
  }
}
