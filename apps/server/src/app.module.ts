import { Module } from '@nestjs/common';
import { ChatModule } from './chat/chat.module';
import { ConfigModule } from '@nestjs/config';
import config from './config/config';
import { join } from 'path';

@Module({
  imports: [
    ChatModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      envFilePath: join(process.cwd(), '.env'),
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
