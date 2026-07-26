import { IsOptional, IsString, IsUrl } from 'class-validator';
import { IConnectQuery } from '@shared';

export class ConnectQueryDto implements IConnectQuery {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  name: string;

  @IsUrl()
  avatar: string;
}