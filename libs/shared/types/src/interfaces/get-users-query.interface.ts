import { SortOrderEnum, UserFilterEnum } from '@shared';

export interface IGetUsersQuery {
  filter?: UserFilterEnum;
  search?: string;
  sortByDate?: SortOrderEnum;
}