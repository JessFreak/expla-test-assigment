import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ISendMessage } from '@shared';

export class SendMessageDto implements ISendMessage {
  @IsString()
  @IsNotEmpty()
  receiverId: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  text: string;
}