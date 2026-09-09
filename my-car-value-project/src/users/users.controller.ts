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
  Session,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './user.dto';
import { UsersService } from './users.service';
// `Serialize` custom decorator hai (Serialize() function jo @UseInterceptors() ko khud
// wrap karta hai) — isliye ab @UseInterceptors()/SerializeInterceptor seedha import
// karne ki zaroorat nahi, sirf `Serialize` hi kaafi hai
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { UserDto } from 'src/users/user.dto';
// AuthV2Service — signup/signin ka poora workflow (bcrypt hashing, exact-match email
// lookup) yahi handle karta hai, dekho src/users/auth-v2.service.ts. Purana AuthService
// (src/users/auth.service.ts, hand-rolled scrypt) ab kisi route se use nahi hota, sirf
// reference/comparison ke liye codebase me rakha gaya hai.
import { AuthV2Service } from './auth-v2.service';
// CurrentUser — apna custom param decorator (dekho src/users/decorators/current-user.decorator.ts),
// abhi ke liye ek hardcoded string return karta hai — sirf ye prove karne ke liye ki wiring
// (createParamDecorator → @CurrentUser() → controller param) sahi se kaam kar rahi hai.
// Agla step isse real session-based user return karwana hoga.
import { CurrentUser } from './decorators/current-user.decorator';

// `@Session()` (@nestjs/common) request ka `req.session` object inject karta hai —
// runtime pe ye `cookie-session` middleware (dekho main.ts) se populate hota hai.
// Decorator khud value ko `any` type deta hai, isliye yaha apna explicit shape
// declare kiya taaki `session.userId` type-safe rahe.
// `| null` isliye add kiya gaya kyunki signout `session.userId = null` set karke logout
// karta hai — `undefined` (session me kabhi set hi nahi hua) aur `null` (explicitly logout
// hua) dono "not signed in" states hain, `if (!session.userId)` check dono ko cover karta hai.
interface AuthSession {
  userId?: number | null;
}

// @Controller('auth') is class ke saare routes ke aage `/auth` prefix laga deta hai
// (isliye neeche wala route asal me `/auth/signup` pe hit hota hai)
@Controller('auth')
export class UsersController {
  // Dono services inject kiye — UsersService abhi bhi findUser/findAllUsers/update/remove
  // ke liye direct use ho raha hai, signup/signin AuthV2Service ko delegate hote hain
  // (Nest DI container dono ko khud instantiate karke de deta hai, users.module.ts ke
  // `providers: [UsersService, ..., AuthV2Service]` array me registered hone ki wajah se)
  constructor(
    private readonly usersService: UsersService,
    private readonly authV2Service: AuthV2Service,
  ) {}

  // POST /auth/signup — naya user create karne ka endpoint
  @Post('/signup')
  @Serialize(UserDto)
  async create(
    @Body() bodyData: CreateUserDto,
    @Session() session: AuthSession,
  ) {
    // @Body() poore request body ko `CreateUserDto` me convert karta hai
    // main.ts me lagaya gaya global ValidationPipe request aane se pehle hi
    // `email`/`password` ko CreateUserDto ke decorators (@IsEmail, @IsString) se validate kar chuka hota hai —
    // agar validation fail ho to controller ka code chalta hi nahi, seedha 400 error chala jaata hai
    //
    // Controller ko signup ke internal detail (hashing kaise, duplicate-check kaise) se
    // koi matlab nahi — sirf "signup karo" bolta hai, KAISE hota hai wo AuthV2Service ki
    // responsibility hai (separation of concerns). `return` isliye kiya taaki Nest is
    // returned Promise ko resolve karke response body me saved user bhej de.
    const user = await this.authV2Service.signup(
      bodyData.email,
      bodyData.password,
    );
    session.userId = user.id;
    return user;
  }

  // POST /auth/signin — existing user login karne ka endpoint. Signup jaisa hi
  // `CreateUserDto` (email + password) reuse kiya — dono requests ka shape same hai,
  // isliye alag "SigninDto" banane ki zaroorat nahi padi.
  @Post('/signin')
  @Serialize(UserDto)
  async signIn(
    @Body() bodyData: CreateUserDto,
    @Session() session: AuthSession,
  ) {
    // authV2Service.signin() email+password verify karta hai (dekho src/users/auth-v2.service.ts)
    // aur match hone par poora `User` return karta hai — `@Serialize(UserDto)` yaha bhi
    // laga hai, isliye response me `password` (hashed hi sahi) kabhi client tak nahi jaayega
    const user = await this.authV2Service.signin(
      bodyData.email,
      bodyData.password,
    );
    session.userId = user.id;
    return user;
  }

  @Get('/me')
  @Serialize(UserDto)
  async getMeInfo(@Session() session: AuthSession) {
    if (!session.userId) {
      throw new UnauthorizedException('Not signed in');
    }

    const user = await this.usersService.findOne(session.userId);
    if (!user) {
      throw new NotFoundException('user not found');
    }

    return user;
  }

  // POST /auth/signout — logout karne ka endpoint. Session se koi data DELETE nahi
  // kiya (cookie-session me poora session hi ek cookie hai, individual key delete
  // karne ka koi seedha API nahi) — bas `userId` ko `null` set kar diya, jisse
  // `/auth/me`, `/auth/:id` jaisi jagah wala `if (!session.userId)` check ab
  // "signed out" treat karega. Koi response body nahi bheja (204-jaisa behavior).
  @Post('/signout')
  signout(@Session() session: AuthSession) {
    session.userId = null;
  }

  // GET /auth/whoami — `@CurrentUser()` custom decorator ka demo/test route hai.
  // `CurrentUser` abhi hardcoded `'hi there !'` return karta hai (dekho decorator
  // file ka comment), isliye yaha `user: string` type diya — jab decorator ko real
  // session-based user return karwaya jayega, ye type bhi `User` me update karna hoga.
  @Get('/whoami')
  whoAmI(@CurrentUser() user: string) {
    return user;
  }

  // @Serialize(UserDto) — custom decorator (dekho src/interceptors/serialize.interceptor.ts)
  // jo internally `@UseInterceptors(new SerializeInterceptor(UserDto))` lagata hai.
  // Response jaane se pehle poore `User` entity (jisme `password` bhi hota hai) ko
  // `UserDto` shape (sirf `id`, `email`) me convert kar deta hai — password kabhi client
  // tak nahi pahunchta. Method-level lagaya hai, isliye sirf yahi route protect hai —
  // `create`/`update`/`remove` abhi bhi raw entity return karte hain (known gap, README me documented)
  @Serialize(UserDto)
  @Get('/:id')
  async findUser(@Param('id') id: string, @Session() session: AuthSession) {
    const user = await this.usersService.findOne(parseInt(id));
    if (!user) {
      throw new NotFoundException('user not found');
    }
    session.userId = user.id;
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
