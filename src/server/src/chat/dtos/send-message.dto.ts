import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ISendMessage } from '@shared';
import { trimString } from '../../utils/transform.utils';

export class SendMessageDto implements ISendMessage {
  @IsString()
  receiverId: string;

  @IsString()
  @Transform(trimString)
  @IsNotEmpty()
  text: string;
}