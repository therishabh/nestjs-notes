import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CreateMessageDto } from './dtos/create-message.dto';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messageService: MessagesService) {}

  @Get('/')
  getMessages(): any {
    return this.messageService.findAll();
  }

  @Get('/:id')
  getMessageById(@Param('id') id: string): any {
    return this.messageService.findById(id);
  }

  @Post('/')
  createMessage(@Body() body: CreateMessageDto): any {
    return this.messageService.createMessage(body.message, body.category);
  }

  @Put('/:id')
  updateMessage(@Body() body: CreateMessageDto, @Param('id') id: string): any {
    return this.messageService.updateMessage(id, body);
  }
}
