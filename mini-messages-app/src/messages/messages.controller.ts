import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CreateMessageDto } from './dtos/create-message.dto';

@Controller('messages')
export class MessagesController {
  @Get('/')
  getMessages() {
    return 'Hello from Messages!';
  }

  @Get('/:id')
  getMessageById(@Param('id') id: string) {
    return 'Message with id: ' + id;
  }

  @Post('/')
  createMessage(@Body() body: CreateMessageDto) {
    return (
      'Message created with text: ' + body.text + ' and author: ' + body.author
    );
  }

  @Put('/:id')
  updateMessage(@Body() body: { text: string }, @Param('id') id: string) {
    return 'Message with id: ' + id + ' updated with text: ' + body.text;
  }
}
