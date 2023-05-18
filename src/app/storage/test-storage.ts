import { ConflictException } from '@nestjs/common'
import { Subscription } from 'src/contants/subscription-api.constant'

export class SubscriberStorage {
  private subscriptions: Subscription[] = []

  getSubscriptionByKey(key: keyof Subscription, value: string): Subscription {
    return this.subscriptions.find(
      (subscription) => subscription[key] === value,
    )
  }

  getSubscriptionByEmail(email: string): Subscription[] {
    return this.subscriptions.filter(
      (subscription) => subscription.email === email,
    )
  }

  createSubscription(subscription: Subscription): Subscription {
    const existingSubscription = this.subscriptions.find(
      (existing) => existing.id === subscription.id,
    )

    if (existingSubscription) {
      throw new ConflictException('User already subscribed for this plan')
    }

    this.subscriptions.push(subscription)
    return subscription
  }

  updateSubscription(
    key: keyof Subscription,
    value: string,
    updatedSubscription: Subscription,
  ): Subscription {
    const index = this.subscriptions.findIndex(
      (subscription) => subscription[key] === value,
    )
    if (index !== -1) {
      this.subscriptions[index] = {
        ...updatedSubscription,
        id: this.subscriptions[index].id,
      }

      console.log(this.subscriptions[index])
      return this.subscriptions[index]
    }
    return undefined
  }
}
