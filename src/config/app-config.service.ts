import { Injectable } from '@nestjs/common'
import { ConfigService } from 'nestjs-node-config-module'
import { AppConfig, Config } from './app-config.model'

@Injectable()
export class AppConfigService extends ConfigService {
  getAppConfig(): AppConfig {
    return this.get<AppConfig>('app')
  }

  getConfig(): Config {
    return this.get<Config>('config')
  }
}
