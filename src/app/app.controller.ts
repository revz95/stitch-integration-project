import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { AppService } from './app.service'
import {
  UserSubscriptionDto,
  SubscriptionDto,
  RefreshDto,
} from 'src/dto/input.dto'
import { Subscription, UserToken } from 'src/contants/subscription-api.constant'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  //Subscription Endpoints
  @Post('subscribe')
  async subscribe(@Body() input: SubscriptionDto) {
    await this.appService.createSubscription(input)
    return { message: `Subscription created successfully for ${input.email}` }
  }

  @Get('get-subscriptions/:email')
  async getSubscriptions(@Param('email') email: string) {
    return await this.appService.getAllSubscriptions(email)
  }

  @Get('get-subscription/:id')
  async getSubscription(@Param('id') id: string) {
    return await this.appService.getSubscription('id', id)
  }

  // Instant Pay Endpoints
  @Post('pay-instant')
  async createInstantPaymentRequestUrl(@Body() input: UserSubscriptionDto) {
    const uuid = this.appService.generateSubscriptionId(input.email, input.plan)
    const subscription: Subscription = this.appService.getSubscription(
      'id',
      uuid,
    )
    const accessToken = this.appService.retrieveAccessToken(input.email)

    const res = await this.appService.createInstantPaymentRequestUrl(
      accessToken,
      subscription,
      uuid,
    )
    return `Payment for subscription ${input.plan} can be initiated through following this link: ${res}`
  }

  @Post('payment-status')
  async getPaymentRequestStatus(@Body() queryParams: UserSubscriptionDto) {
    const uuid = this.appService.generateSubscriptionId(
      queryParams.email,
      queryParams.plan,
    )
    const subscription = this.appService.getSubscription('id', uuid)
    const paymentId = subscription.paymentInitiationRequestId

    const accessToken = this.appService.retrieveAccessToken(queryParams.email)

    const res = await this.appService.getPaymentRequestStatus(
      paymentId,
      accessToken,
    )
    return res
  }

  @Post('payment-confirmation')
  async getPaymentConfirmation(@Body() queryParams: UserSubscriptionDto) {
    const uuid = this.appService.generateSubscriptionId(
      queryParams.email,
      queryParams.plan,
    )
    const subscription = this.appService.getSubscription('id', uuid)
    const paymentId = subscription.paymentInitiationRequestId

    const accessToken = this.appService.retrieveAccessToken(queryParams.email)

    const res = await this.appService.getPaymentConfirmation(
      paymentId,
      accessToken,
    )
    return res
  }

  // Linked Payments
  @Post('link-acc')
  async linkAccount(@Body() input: UserSubscriptionDto) {
    const uuid = this.appService.generateSubscriptionId(input.email, input.plan)
    const subscription: Subscription = this.appService.getSubscription(
      'id',
      uuid,
    )
    const accessToken = this.appService.retrieveAccessToken(input.email)
    const linkUrl = await this.appService.createLinkedAuthUrl(
      accessToken,
      subscription,
    )
    return `Payment for subscription ${input.plan} can be initiated: ${linkUrl}`
  }

  @Get('account-info/:email')
  async getAccInfo(@Param('email') email: string) {
    const userToken = this.appService.retrieveUserToken(email)
    return this.appService.getLinkedAccInfo(userToken)
  }

  @Post('pay-link')
  async payForSubscriptionLinked(@Body() input: UserSubscriptionDto) {
    const userToken = this.appService.retrieveUserToken(input.email)
    return await this.appService.initiatePayment(userToken, input)
  }

  @Post('refresh')
  async refresh(@Body() input: RefreshDto) {
    const refreshToken = this.appService.retrieveRefreshToken(input.email)
    const refresh: UserToken = await this.appService.refreshToken(refreshToken)

    this.appService.setUserToken(input.email, refresh.access_token)
    this.appService.setRefreshToken(input.email, refresh.refresh_token)
    return refresh
  }

  @Post('refund')
  async requestRefund(@Body() input: UserSubscriptionDto) {
    const clientToken = await this.appService.retrieveTokenUsingClientSecret([
      'client_refund',
      'client_paymentrequest',
    ])
    const accessToken = clientToken.access_token
    const uuid = this.appService.generateSubscriptionId(input.email, input.plan)
    const subscription = this.appService.getSubscription('id', uuid)
    const paymentId = subscription.paymentInitiationRequestId

    await this.appService.createRefundRequest(accessToken, paymentId, input)
    return
  }

  @Get('return')
  async redirect(@Query() queryParams: any) {
    const returnCase = queryParams.payment_method == 'eft' ? 'instant' : 'link'
    console.log(queryParams)

    switch (returnCase) {
      case 'instant':
        this.appService.updateSubscription(
          'paymentInitiationRequestId',
          queryParams.id,
          { status: 'complete' },
        )
        break

      case 'link':
        const verifierInfo = this.appService.retrieveStoredVerifierInfo(
          queryParams.state,
        )

        const userToken: UserToken =
          await this.appService.retrieveUserTokenInfo(
            queryParams.code,
            verifierInfo.verifier,
          )

        this.appService.setUserToken(verifierInfo.email, userToken.access_token)
        this.appService.setRefreshToken(
          verifierInfo.email,
          userToken.refresh_token,
        )
        break

      default:
        console.log('Unknown case')
    }
    return
  }

  @Post('simulate')
  async simulate(@Body() input: any) {
    const clientToken = await this.appService.retrieveTokenUsingClientSecret([
      'client_refund',
      'client_paymentrequest',
    ])
    const accessToken = clientToken.access_token
    this.appService.simulateConfirmation(input.id, accessToken)
  }
}
