export const createLinkedPaymentRequestMutation = `
mutation clientPaymentAuthorizationRequestCreate ($input: ClientPaymentAuthorizationRequestCreateInput!) {
  clientPaymentAuthorizationRequestCreate (input: $input) {
      authorizationRequestUrl
  }
}`

export const getLinkedAccountAndIdentityInfo = `
query GetLinkedAccountAndIdentityInfo {
  user {
    paymentAuthorization {
      bankAccount {
        id
        name
        accountNumber
        accountType
        bankId
        accountHolder {
          __typename
          ... on Individual {
            fullName
            email
          }
        }
      }
    }
  }
}`

export const userInitiatePayment = `
mutation UserInitiatePayment(
  $amount: MoneyInput!) {
userInitiatePayment(input: {
    amount: $amount
  }) {
  paymentInitiation {
    amount
    date
    id
    status {
      __typename
    }
  }
}
}`

export const retrievePaymentInitiationById = `
query RetrievePaymentInitiationById($paymentInitiationId: ID!) {
  node(id: $paymentInitiationId) {
    ... on PaymentInitiation {
      id
      amount
      externalReference
      beneficiaryReference
      status {
        __typename
        ... on PaymentInitiationCompleted {
          date
          payer {
            ... on PaymentInitiationBankAccountPayer {
              accountNumber
              bankId
            }
          }
        }
        ... on PaymentInitiationCancelled {
          date
          reason
        }
        ... on PaymentInitiationPending {
          __typename
        }
        ... on PaymentInitiationExpired {
          __typename
          date
        }
      }
      paymentConfirmation {
        ... on PaymentPending {
          __typename
          date
        }
        ... on PaymentReceived {
          __typename
          estimatedSettlement
          received
        }
        ... on PaymentUnsettled {
          __typename
          description
        }
      }
    }
  }
}`
