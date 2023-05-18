import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from 'nestjs-node-config-module'
import { AppConfigService } from '../config/app-config.service'
import { SubscriberStorage } from './storage/test-storage'
import { Utils } from './utils/util-functions'
import { TokenFunctions } from './utils/token-functions'

@Module({
  imports: [
    ConfigModule.forRoot({
      printConfigSources: true,
      configDir:
        '/Users/revanzyl/Documents/personal_development/integration-project/src/config',
      serviceClass: AppConfigService,
      strictMode: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, SubscriberStorage, Utils, TokenFunctions],
})
export class AppModule {}
