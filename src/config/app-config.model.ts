export class AppConfig {
  host: 'localhost'
  port?: {
    http?: number
  }
  clientToken: {
    clientId: string
    clientSecret: string
  }
  client: {
    name: string
    bankId: string
    accountNumber: string
  }
  webhookUrl: string
}

export class Config {
  app: AppConfig
}
