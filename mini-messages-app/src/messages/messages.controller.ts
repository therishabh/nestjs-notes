import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';

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
  createMessage(@Body() body: { text: string }) {
    return 'Message created with text: ' + body.text;
  }

  @Put('/:id')
  updateMessage(@Body() body: { text: string }, @Param('id') id: string) {
    return 'Message with id: ' + id + ' updated with text: ' + body.text;
  }
}
