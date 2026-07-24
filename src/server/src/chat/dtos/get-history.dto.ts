import { IsNotEmpty, IsString } from 'class-validator';
import { IGetHistory } from '@shared';

export class GetHistoryDto implements IGetHistory {
  @IsString()
  @IsNotEmpty()
  withUserId: string;
}