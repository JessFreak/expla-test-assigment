import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  receiverId: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  text: string;
}