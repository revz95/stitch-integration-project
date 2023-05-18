import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { createHash, randomUUID } from 'crypto'
import { AppConfigService } from 'src/config/app-config.service'
import { UserSubscriptionDto, SubscriptionDto } from 'src/dto/input.dto'
import { SubscriberStorage } from './storage/test-storage'
import {
  createPaymentRequest,
  getPaymentRequestStatus,
  retrievePaymentInitiationRequestConfirmationById,
} from 'src/graphql-queries/payment-request-instant'
import {
  createLinkedPaymentRequestMutation,
  getLinkedAccountAndIdentityInfo,
  userInitiatePayment,
} from 'src/graphql-queries/payment-request-linked'
import { webhookSubscriptionMutation } from 'src/graphql-queries/webhook'
import { Utils } from './utils/util-functions'
import { TokenFunctions } from './utils/token-functions'
import { simulatePaymentConfirmation } from 'src/graphql-queries/simulate-payment-confirmation'
import { createRefund } from 'src/graphql-queries/refund'
import {
  ClientToken,
  Subscription,
  SubscriptionStatus,
  SubscriptionTypes,
  UserToken,
  WebhookResponse,
  subscriptionAmountMap,
} from 'src/contants/subscription-api.constant'

@Injectable()
export class AppService {
  constructor(
    private readonly storage: SubscriberStorage,
    private readonly tokenFunctions: TokenFunctions,
    private readonly utils: Utils,
    private readonly config: AppConfigService,
  ) {}
  private readonly logger = new Logger('SubscriptionApi')

  private readonly clientId = this.config.getAppConfig().clientToken.clientId
  private readonly clientSecret =
    this.config.getAppConfig().clientToken.clientSecret

  private readonly webhookUrl = this.config.getAppConfig().webhookUrl

  private readonly name = this.config.getAppConfig().client.name
  private readonly bank = this.config.getAppConfig().client.bankId
  private readonly accNum = this.config
    .getAppConfig()
    .client.accountNumber.toString()

  private readonly stitchSecure = 'https://secure.stitch.money/connect/token'
  private readonly stitchGraphQL = 'https://api.stitch.money/graphql'
  private readonly redirectUri = 'http://localhost:3000/return'

  // Subscription Functions
  async createSubscription(subscriptionData: SubscriptionDto) {
    const uuid = this.generateSubscriptionId(
      subscriptionData.email,
      subscriptionData.plan,
    )
    const subscriptionBody = {
      ...subscriptionData,
      id: uuid,
      status: 'pending' as SubscriptionStatus,
    }

    const clientToken: ClientToken = await this.retrieveTokenUsingClientSecret([
      'client_paymentrequest',
      'client_paymentauthorizationrequest',
    ])
    const accessToken = clientToken.access_token

    this.tokenFunctions.setAccessToken(subscriptionData.email, accessToken)

    this.storage.createSubscription(subscriptionBody)
    this.logger.log(
      `Subscription ${subscriptionData.plan} created for user ${subscriptionData.email}`,
    )
    return
  }

  getAllSubscriptions(email: string): Subscription[] {
    return this.storage.getSubscriptionByEmail(email)
  }

  getSubscription(key: keyof Subscription, value: string): Subscription {
    const existingSubscription = this.storage.getSubscriptionByKey(key, value)
    if (!existingSubscription) {
      throw new NotFoundException('Subscription not found')
    }
    return existingSubscription
  }

  updateSubscription(key: keyof Subscription, value: string, updatedData: any) {
    const existingSubscription = this.getSubscription(key, value)
    if (!existingSubscription) {
      throw new NotFoundException('Subscription not found')
    }
    const updatedSubscription = { ...existingSubscription, ...updatedData }
    this.storage.updateSubscription(key, value, updatedSubscription)
    return
  }

  // Get Client Token
  async retrieveTokenUsingClientSecret(scopes: string[]): Promise<ClientToken> {
    const body = {
      grant_type: 'client_credentials',
      client_id: this.clientId,
      scope: scopes.join(' '),
      audience: this.stitchSecure,
      client_secret: this.clientSecret,
    }

    const res = await this.utils.fetchFromStitch(body, this.stitchSecure)

    return res
  }

  // Get User Token
  async retrieveUserTokenInfo(
    code: string,
    verifier: string,
  ): Promise<UserToken> {
    const body = {
      grant_type: 'authorization_code',
      client_id: this.clientId,
      code: code,
      redirect_uri: this.redirectUri,
      client_secret: this.clientSecret,
      code_verifier: verifier,
    }

    return await this.utils.fetchFromStitch(body, this.stitchSecure)
  }

  // Webhook subscription
  async subscribeToWebhook(token: string): Promise<WebhookResponse> {
    const urqlClient = this.utils.createUrqlClient(token, this.stitchGraphQL)

    const result = await urqlClient
      .mutation(webhookSubscriptionMutation, { url: this.webhookUrl })
      .toPromise()

    return result.data
  }

  // Instant Pay Functions
  async createInstantPaymentRequestUrl(
    token: string,
    subscription: Subscription,
    subId: string,
  ) {
    await this.subscribeToWebhook(token)
    const amt = subscriptionAmountMap.get(subscription.plan)
    const urqlClient = this.utils.createUrqlClient(token, this.stitchGraphQL)

    const result = await urqlClient
      .mutation(createPaymentRequest, {
        amount: {
          quantity: amt,
          currency: 'ZAR',
        },
        payerReference: `${this.name} sub`,
        beneficiaryReference: `${subscription.name}`,
        beneficiaryName: this.name,
        beneficiaryBankId: this.bank,
        beneficiaryAccountNumber: this.accNum,
      })
      .toPromise()

    if (result.error) {
      this.logger.error(`Error ${result.error}`)
      return
    }

    const id =
      result.data?.clientPaymentInitiationRequestCreate.paymentInitiationRequest
        .id
    this.updateSubscription('id', subId, { paymentInitiationRequestId: id })

    const url: string =
      result.data?.clientPaymentInitiationRequestCreate.paymentInitiationRequest
        .url
    const urlRedirect = url
      .toString()
      .concat(`?redirect_uri=${this.redirectUri}`)

    this.logger.log(
      `Payment url created for user: ${subscription.email} for ${subscription.plan} subscription.`,
    )

    return urlRedirect
  }

  async getPaymentRequestStatus(paymentId: string, token: string) {
    const urqlClient = this.utils.createUrqlClient(token, this.stitchGraphQL)

    const result = await urqlClient
      .query(getPaymentRequestStatus, {
        paymentRequestId: paymentId,
      })
      .toPromise()
    return result.data?.node.state.__typename
  }

  async getPaymentConfirmation(paymentId: string, token: string) {
    const urqlClient = this.utils.createUrqlClient(token, this.stitchGraphQL)

    const result = await urqlClient
      .query(retrievePaymentInitiationRequestConfirmationById, {
        paymentInitiationRequestId: paymentId,
      })
      .toPromise()
    return result.data
  }

  // Linked Pay Functions
  async createLinkedAuthUrl(token: string, sub: SubscriptionDto) {
    const urqlClient = this.utils.createUrqlClient(token, this.stitchGraphQL)

    const result = await urqlClient
      .mutation(createLinkedPaymentRequestMutation, {
        input: {
          beneficiary: {
            bankAccount: {
              name: this.name,
              bankId: this.bank,
              accountNumber: this.accNum,
              accountType: 'current',
              beneficiaryType: 'private',
              reference: `${sub.name}`,
            },
          },
          payer: {
            name: sub.name,
            email: sub.email,
            reference: `${this.name} sub`,
          },
        },
      })
      .toPromise()

    const authorizationRequestUrl: string =
      result.data?.clientPaymentAuthorizationRequestCreate
        .authorizationRequestUrl

    const [verifier, challenge] =
      await this.utils.generateVerifierChallengePair()
    const state = this.utils.generateRandomStateOrNonce()
    const nonce = this.utils.generateRandomStateOrNonce()

    const urlParameters = this.utils.buildAuthorizationUrl(
      this.clientId,
      challenge,
      state,
      nonce,
      this.redirectUri,
      [
        'client_paymentauthorizationrequest',
        'openid',
        'transactions',
        'accounts',
        'balances',
        'accountholders',
        'offline_access',
      ],
    )
    const verifierInfo = { verifier: verifier, email: sub.email }
    this.tokenFunctions.setVerifierInfo(state, verifierInfo)

    const url = authorizationRequestUrl.concat(`?${urlParameters}`)

    if (result.error) {
      this.logger.error(`Error ${result.error}`)
      return
    }

    this.logger.log(`Link account for user: ${sub.email}`)
    return url
  }

  async getLinkedAccInfo(userToken: string) {
    const urqlClient = this.utils.createUrqlClient(
      userToken,
      this.stitchGraphQL,
    )

    const result = await urqlClient
      .query(getLinkedAccountAndIdentityInfo, {})
      .toPromise()
    return result.data?.user.paymentAuthorization.bankAccount
  }

  async initiatePayment(userToken: string, subInfo: UserSubscriptionDto) {
    const uuid = this.generateSubscriptionId(subInfo.email, subInfo.plan)

    const urqlClient = this.utils.createUrqlClient(
      userToken,
      this.stitchGraphQL,
    )
    await this.subscribeToWebhook(userToken)
    const amt = subscriptionAmountMap.get(subInfo.plan)

    const result = await urqlClient
      .mutation(userInitiatePayment, {
        amount: {
          quantity: amt,
          currency: 'ZAR',
        },
      })
      .toPromise()
    const status =
      result.data?.userInitiatePayment.paymentInitiation.status.__typename
    const paymentInitiationRequestId =
      result.data?.userInitiatePayment.paymentInitiation.id
    console.log(status, paymentInitiationRequestId)

    switch (status) {
      case 'PaymentInitiationCompleted': {
        this.updateSubscription('id', uuid, {
          status: 'complete',
          paymentInitiationRequestId: paymentInitiationRequestId,
        })
      }
      default: {
        this.logger.error('Link Pay initiation failed')
      }
    }

    this.logger.log(
      `Link payment initiate for user: ${subInfo.email} for ${subInfo.plan} subscription.`,
    )
    return
  }

  async refreshToken(refresh: string) {
    const body = {
      grant_type: 'refresh_token',
      client_id: this.clientId,
      refresh_token: refresh,
      client_secret: this.clientSecret,
    }

    return await this.utils.fetchFromStitch(body, this.stitchSecure)
  }

  async createRefundRequest(
    token: string,
    id: string,
    input: UserSubscriptionDto,
  ) {
    const urqlClient = this.utils.createUrqlClient(token, this.stitchGraphQL)

    const amt = subscriptionAmountMap.get(input.plan)

    const result = await urqlClient
      .mutation(createRefund, {
        amount: {
          quantity: amt,
          currency: 'ZAR',
        },
        reason: 'requested_by_user',
        nonce: randomUUID(),
        beneficiaryReference: `Refund: ${input.email}`,
        paymentRequestId: id,
      })
      .toPromise()

    await this.subscribeToWebhook(token)

    return result.data
  }

  // Simulate payment
  async simulateConfirmation(paymentId: string, token: string) {
    const urqlClient = this.utils.createUrqlClient(token, this.stitchGraphQL)

    const result = await urqlClient
      .mutation(simulatePaymentConfirmation, {
        paymentInitiationRequestId: paymentId,
      })
      .toPromise()
    console.log('ut ', result)
  }

  retrieveAccessToken(userId: string): string | undefined {
    return this.tokenFunctions.getAccessToken(userId)
  }

  retrieveUserToken(userId: string): string | undefined {
    return this.tokenFunctions.getUserToken(userId)
  }

  retrieveRefreshToken(userId: string): string | undefined {
    return this.tokenFunctions.getRefreshToken(userId)
  }

  retrieveStoredVerifierInfo(id: string) {
    return this.tokenFunctions.getVerifierInfo(id)
  }

  setUserToken(userId: string, token: string) {
    return this.tokenFunctions.setUserToken(userId, token)
  }

  setRefreshToken(userId: string, token: string) {
    this.logger.log(`Refresh user token for user: ${userId}`)
    return this.tokenFunctions.setRefreshToken(userId, token)
  }

  generateSubscriptionId(email: string, plan: SubscriptionTypes): string {
    const hash = createHash('sha256')
    const input = `${plan}${email}`
    hash.update(input)
    const uuid = hash.digest('hex')
    return uuid
  }
}
