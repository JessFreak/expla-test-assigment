import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class ConnectQueryDto {
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