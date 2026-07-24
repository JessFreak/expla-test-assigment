export type UserStatus = 'online' | 'offline';

export interface User {
    id: string;
    name: string;
    avatar: string;
    isBot: boolean;
    status: UserStatus;
}