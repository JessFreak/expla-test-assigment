import { UserStatusEnum } from '../index';

export interface IUser {
    id: string;
    name: string;
    avatar: string;
    isBot: boolean;
    status: UserStatusEnum;
}