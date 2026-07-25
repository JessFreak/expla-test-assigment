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