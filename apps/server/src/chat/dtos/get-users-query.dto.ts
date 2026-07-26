import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IGetUsersQuery, SortOrderEnum, UserFilterEnum } from '@shared';
import { Transform } from 'class-transformer';
import { normalizeSearch } from '../../utils/transform.utils';

export class GetUsersQueryDto implements IGetUsersQuery {
  @IsEnum(UserFilterEnum)
  @IsOptional()
  filter?: UserFilterEnum = UserFilterEnum.ALL;

  @IsString()
  @IsOptional()
  @Transform(normalizeSearch)
  search?: string;

  @IsEnum(SortOrderEnum)
  @IsOptional()
  sortByDate?: SortOrderEnum = SortOrderEnum.DESC;
}