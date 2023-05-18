export const simulatePaymentConfirmation = `
mutation TestClientPaymentConfirmation($paymentInitiationRequestId: ID!)
{
  testClientCreatePaymentConfirmation(input: {paymentRequestId: $paymentInitiationRequestId}) {
    paymentRequestId
  }
}`
