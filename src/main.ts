import { NestFactory } from '@nestjs/core'
import { AppModule } from './app/app.module'
import { AppConfigService } from './config/app-config.service'
import { Logger, ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true })
  app.useGlobalPipes(new ValidationPipe())

  const configSvc = app.get(AppConfigService)
  const appConfig = configSvc.getAppConfig()

  app.enableCors()

  const port = appConfig.port.http || 3000
  const host = appConfig.host || '0.0.0.0'
  await app.listen(port)
  Logger.log(`Application is running on: http://${host}:${port}`)
}

bootstrap()
