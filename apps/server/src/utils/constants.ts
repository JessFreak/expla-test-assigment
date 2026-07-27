export const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Sam', 'Chris', 'Riley', 'Casey',
  'Dakota', 'Jamie', 'Avery', 'Jesse', 'Reese', 'Rowan', 'Quinn', 'Skyler'
] as const;

export const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'
] as const;

export const API_GLOBAL_PREFIX = 'api';

export const USER_ID_HEADER = 'x-user-id';

export const WS_AUTH_ERROR_MESSAGE = 'Unauthorized / Invalid query params';

export const CHAT_KEY_SEPARATOR = '_';

export const BOT_AVATAR_STYLE = 'bottts/svg';
export const USER_AVATAR_STYLE = 'avataaars/svg';

export const REVERSE_BOT_DELAY_MS = 3_000;

export const SPAM_BOT_MIN_DELAY_MS = 10_000;
export const SPAM_BOT_MAX_DELAY_MS = 120_000;
export const SPAM_BOT_PHRASES = [
  'Hi!',
  '5800x3d for 200$!',
  'Hello? Anyone here?',
  'Subscribe!!!',
  'HIRE ME!',
  'HELLO. HERE IS MY RESUME...',
  'For close to the same price, 5060 ti 16gb or 5070 12gb',
  'Create with the Best AI Models',
  '🇪🇸 В Іспанії гарячі розпродажі!',
  'Не міг не привітати. Сам побачиш чому',
  '🔋 EcoFlow та Bluetti',
  '✨ Знижки до -70% у магазинах Європи та США!',
  'help with first pc',
] as const;
