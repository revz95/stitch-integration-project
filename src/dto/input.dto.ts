import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator'
import { SubscriptionTypes } from 'src/contants/subscription-api.constant'

export class SubscriptionDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string
  @IsEmail()
  @IsNotEmpty()
  readonly email: string
  @IsString()
  @IsNotEmpty()
  @IsEnum(SubscriptionTypes)
  readonly plan: SubscriptionTypes
}

export class UserSubscriptionDto {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string
  @IsString()
  @IsNotEmpty()
  @IsEnum(SubscriptionTypes)
  readonly plan: SubscriptionTypes
}

export class RefreshDto {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string
}
