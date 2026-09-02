import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  NotFoundException,
} from '@nestjs/common';
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
  async getMessageById(@Param('id') id: string) {
    const message = await this.messageService.findById(id);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
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
