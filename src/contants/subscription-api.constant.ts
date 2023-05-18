export enum SubscriptionTypes {
  OhanaTriviaExtravaganza = 'ohana_trivia_extravaganza',
  StitchTogetherWatchAThon = 'stitch_together_watch_a_thon',
  ExperimentCostumeCraze = 'experiment_costume_craze',
  LilosKitchenAdventure = 'lilos_kitchen_adventure',
}

export const subscriptionAmountMap: Map<SubscriptionTypes, number> = new Map([
  [SubscriptionTypes.OhanaTriviaExtravaganza, 10],
  [SubscriptionTypes.StitchTogetherWatchAThon, 15],
  [SubscriptionTypes.ExperimentCostumeCraze, 20],
  [SubscriptionTypes.LilosKitchenAdventure, 12],
])

export type ClientToken = {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
}

export type UserToken = {
  id_token: string
  access_token: string
  expires_in: number
  refresh_token: string
  token_type: string
  scope: string
}

export type SubscriptionStatus = 'pending' | 'complete' | 'cancelled' | 'failed'

export type PaymentQueryParams = {
  paymentId: string
  email: string
}

export type Subscription = {
  email: string
  plan: SubscriptionTypes
  name: string
  id: string
  status: SubscriptionStatus
  paymentInitiationRequestId?: string
}

export type WebhookResponse = {
  url: string
  id: string
  filterTypes: string[]
  secret: string
}

export type VerifierMapInfo = {
  verifier: string
  email: string
}
