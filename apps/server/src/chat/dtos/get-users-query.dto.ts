import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IGetUsersQuery, UserFilterEnum } from '@shared';

export class GetUsersQueryDto implements IGetUsersQuery {
  @IsEnum(UserFilterEnum)
  @IsOptional()
  filter?: UserFilterEnum = UserFilterEnum.ALL;

  @IsString()
  @IsOptional()
  search?: string;
}