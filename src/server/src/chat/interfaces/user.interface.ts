import { UserStatus } from '../enums';

export interface User {
    id: string;
    name: string;
    avatar: string;
    isBot: boolean;
    status: UserStatus;
}