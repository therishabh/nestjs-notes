import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Put,
  Patch,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './user.dto';
import { UsersService } from './users.service';

// @Controller('auth') is class ke saare routes ke aage `/auth` prefix laga deta hai
// (isliye neeche wala route asal me `/auth/signup` pe hit hota hai)
@Controller('auth')
export class UsersController {
  // UsersService inject kiya — Nest DI container isse khud instantiate karke de deta hai
  // (users.module.ts ke `providers: [UsersService]` array me registered hone ki wajah se)
  constructor(private readonly usersService: UsersService) {}

  // POST /auth/signup — naya user create karne ka endpoint
  @Post('/signup')
  create(@Body() bodyData: CreateUserDto) {
    // @Body() poore request body ko `CreateUserDto` me convert karta hai
    // main.ts me lagaya gaya global ValidationPipe request aane se pehle hi
    // `email`/`password` ko CreateUserDto ke decorators (@IsEmail, @IsString) se validate kar chuka hota hai —
    // agar validation fail ho to controller ka code chalta hi nahi, seedha 400 error chala jaata hai
    // usersService.create() ek Promise<User> return karta hai (DB insert async hota hai) —
    // isliye yaha `return` kiya, taaki Nest is Promise ko resolve karke response body me
    // saved user (id ke saath) bhej de, warna client ko empty response milta
    return this.usersService.create(bodyData.email, bodyData.password);
  }

  @Get('/:id')
  async findUser(@Param('id') id: string) {
    const user = await this.usersService.findOne(parseInt(id));
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return user;
  }

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
