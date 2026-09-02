import { Injectable } from '@nestjs/common';
import { MessagesRepository } from './messages.repository';

@Injectable()
export class MessagesService {
  constructor(private readonly messagesRepository: MessagesRepository) {}

  findAll() {
    return this.messagesRepository.findAll();
  }

  findById(id: string) {
    return this.messagesRepository.findById(id);
  }

  createMessage(message: string, category: string) {
    return this.messagesRepository.create({ message, category });
  }

  updateMessage(
    id: string,
    { message, category }: { message: string; category: string },
  ) {
    return this.messagesRepository.update(id, { message, category });
  }

  deleteMessage(id: string) {
    return this.messagesRepository.delete(id);
  }
}
