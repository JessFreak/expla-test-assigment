import { IsNotEmpty, IsString } from 'class-validator';

export class GetHistoryDto {
  @IsString()
  @IsNotEmpty()
  withUserId: string;
}