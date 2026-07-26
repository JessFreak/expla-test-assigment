import { IUser } from './user.interface';

export interface IConnectQuery {
  id: string;
  name: string;
  avatar: string;
}

export interface IGetHistory {
  withUserId: string;
}

export interface ISendMessage {
  receiverId: string;
  text: string;
}

export interface IChatPreview {
  user: IUser;
  lastMessageText: string | null;
  lastMessageTimestamp: number | null;
}