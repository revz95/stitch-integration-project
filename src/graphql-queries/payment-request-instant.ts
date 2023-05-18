export const createPaymentRequest = `
mutation CreatePaymentRequest(
    $amount: MoneyInput!,
    $payerReference: String!,
    $beneficiaryReference: String!,
    $beneficiaryName: String!,
    $beneficiaryBankId: BankBeneficiaryBankId!,
    $beneficiaryAccountNumber: String!) {
  clientPaymentInitiationRequestCreate(input: {
      amount: $amount,
      payerReference: $payerReference,
      beneficiaryReference: $beneficiaryReference,
      beneficiary: {
          bankAccount: {
              name: $beneficiaryName,
              bankId: $beneficiaryBankId,
              accountNumber: $beneficiaryAccountNumber
          }
      }
    }) {
    paymentInitiationRequest {
      id
      url
    }
  }
}`

export const getPaymentRequestStatus = `
query GetPaymentRequestStatus($paymentRequestId: ID!) {
  node(id: $paymentRequestId) {
    ... on PaymentInitiationRequest {
      id
      url
      payerReference
      state {
        __typename
        ... on PaymentInitiationRequestCompleted {
          date
          amount
          payer {
            ... on PaymentInitiationBankAccountPayer {
              accountNumber
              bankId
            }
          }
          beneficiary {
            ... on BankBeneficiary {
              bankId
            }
          }
        }
        ... on PaymentInitiationRequestCancelled {
          date
          reason
        }
        ... on PaymentInitiationRequestPending {
          __typename
          paymentInitiationRequest {
            id
          }
        }
      }
    }
  }
}`

export const retrievePaymentInitiationRequestConfirmationById = `
query RetrievePaymentInitiationRequestConfirmationById($paymentInitiationRequestId: ID!) {
  node(id: $paymentInitiationRequestId) {
    ... on PaymentInitiationRequest {
      id
      amount
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
