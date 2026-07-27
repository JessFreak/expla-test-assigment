export const CHAT_TAB_STORAGE_KEY = 'chat_tab_id';
export const CHAT_PROFILE_STORAGE_KEY_PREFIX = 'chat_user_profile_';

export const WEBSOCKET_TRANSPORT = 'websocket';
export const SOCKET_CONNECT_EVENT = 'connect';
export const SOCKET_DISCONNECT_EVENT = 'disconnect';
export const SOCKET_CONNECT_ERROR_EVENT = 'connect_error';
export const SOCKET_EXCEPTION_EVENT = 'exception';

export interface TimeInterval {
  label: string;
  seconds: number;
}

export const TIME_INTERVALS: TimeInterval[] = [
  { label: 'm', seconds: 2_592_000 },
  { label: 'd', seconds: 86_400 },
  { label: 'h', seconds: 3_600 },
  { label: 'm', seconds: 60 },
] as const;

export const TIME_AGO_UPDATE_INTERVAL_MS = 60_000;
