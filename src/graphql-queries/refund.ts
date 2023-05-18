export const createRefund = `
mutation CreateRefund(
    $amount: MoneyInput!,
    $reason: RefundReason!,
    $nonce: String!,
    $beneficiaryReference: String!,
    $paymentRequestId: ID!
) {
  clientRefundInitiate(input: {
      amount: $amount,
      reason: $reason,
      nonce: $nonce,
      beneficiaryReference: $beneficiaryReference,
      paymentRequestId: $paymentRequestId
    }) {
    refund {
      id
      paymentInitiationRequest {
        id
      }
    }
  }
}`

export const getRefundStatus = `
query GetRefundStatus($refundId: ID!) {
    node(id: $refundId) {
      ... on Refund {
        id
        status {
          ... on RefundPending {
            __typename
            date
          }
          ... on RefundSubmitted {
            __typename
            date
          }
          ... on RefundCompleted {
            __typename
            date
          }
          ... on RefundError {
            __typename
            date
            reason
          }
        }
      }
    }
  }`
