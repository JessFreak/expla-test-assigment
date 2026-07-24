import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { IConnectQuery } from '@shared';

export class ConnectQueryDto implements IConnectQuery {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  avatar: string;
}