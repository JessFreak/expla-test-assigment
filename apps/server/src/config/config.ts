import { registerAs } from '@nestjs/config';
import * as process from 'node:process';

export default registerAs('config', () => ({
  serverPort: process.env.SERVER_PORT,
  clientUrl: process.env.CLIENT_URL,
  avatarBaseUrl: process.env.AVATAR_BASE_URL,
}));