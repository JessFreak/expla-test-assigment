import { IsString, IsUrl } from 'class-validator';
import { IConnectQuery } from '@shared';

export class ConnectQueryDto implements IConnectQuery {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsUrl()
  avatar: string;
}