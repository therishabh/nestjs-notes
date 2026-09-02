import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { readFile, writeFile } from 'fs/promises';

export interface IMessage {
  id: string;
  message: string;
  category: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  isDeleted: boolean;
}
export interface IResponseMessage {
  id: string;
  message: string;
  category: string;
  created_at: string;
}

export interface ICreateMessageDto {
  message: string;
  category: string;
}
@Injectable()
export class MessagesRepository {
  async findAll(): Promise<IResponseMessage[]> {
    try {
      const data = await readFile('messages.json', 'utf-8');
      const messages = JSON.parse(data) as IMessage[];
      const filteredMessages = messages.filter(
        (msg: IMessage) => !msg.isDeleted,
      );
      const sortedMessages = filteredMessages.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      const result = sortedMessages.map(
        ({ id, message, category, created_at }) => ({
          id,
          message,
          category,
          created_at,
        }),
      );
      return result;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      throw new Error('Failed to fetch messages');
    }
  }

  async findById(id: string): Promise<IResponseMessage | null> {
    try {
      const contents = await readFile('messages.json', 'utf-8');
      const messages = JSON.parse(contents) as IMessage[];
      const filteredMessages = messages.filter(
        (msg: IMessage) => !msg.isDeleted,
      );
      const message = filteredMessages.find((msg: IMessage) => msg.id === id);
      return message || null;
    } catch (error) {
      console.error(`Failed to fetch message with id ${id}:`, error);
      throw new Error('Failed to fetch message');
    }
  }

  async create(messageData: ICreateMessageDto): Promise<IResponseMessage> {
    try {
      const contents = await readFile('messages.json', 'utf-8');
      const messages = JSON.parse(contents) as IMessage[];
      const newMessage: IMessage = {
        id: randomUUID(),
        message: messageData.message,
        category: messageData.category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        isDeleted: false,
      };
      messages.push(newMessage);
      console.log(messages);
      await writeFile('messages.json', JSON.stringify(messages, null, 2));
      const result: IResponseMessage = {
        id: newMessage.id,
        message: newMessage.message,
        category: newMessage.category,
        created_at: newMessage.created_at,
      };
      return result;
    } catch (error) {
      console.error('Failed to create message:', error);
      throw new Error('Failed to create message');
    }
  }

  async update(
    id: string,
    messageData: ICreateMessageDto,
  ): Promise<IMessage | null> {
    try {
      const contents = await readFile('messages.json', 'utf-8');
      const messages = JSON.parse(contents) as IMessage[];
      const filteredMessages = messages.filter(
        (msg: IMessage) => !msg.isDeleted,
      );
      const messageIndex = filteredMessages.findIndex(
        (msg: IMessage) => msg.id === id,
      );
      if (messageIndex === -1) {
        return null;
      }
      const updatedMessage: IMessage = {
        ...filteredMessages[messageIndex],
        message: messageData.message,
        category: messageData.category,
        updated_at: new Date().toISOString(),
      };
      messages[messageIndex] = updatedMessage;
      await writeFile('messages.json', JSON.stringify(messages, null, 2));
      return updatedMessage;
    } catch (error) {
      console.error(`Failed to update message with id ${id}:`, error);
      throw new Error('Failed to update message');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const contents = await readFile('messages.json', 'utf-8');
      const messages = JSON.parse(contents) as IMessage[];
      const filteredMessages = messages.filter(
        (msg: IMessage) => !msg.isDeleted,
      );
      const messageIndex = filteredMessages.findIndex(
        (msg: IMessage) => msg.id === id,
      );
      if (messageIndex === -1) {
        return false;
      }
      filteredMessages[messageIndex].isDeleted = true;
      filteredMessages[messageIndex].deleted_at = new Date().toISOString();
      await writeFile('messages.json', JSON.stringify(messages, null, 2));
      return true;
    } catch (error) {
      console.error(`Failed to delete message with id ${id}:`, error);
      throw new Error('Failed to delete message');
    }
  }
}
