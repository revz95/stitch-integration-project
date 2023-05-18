import { randomBytes } from 'crypto'
import { ClientOptions, cacheExchange, createClient, fetchExchange } from 'urql'

export class Utils {
  async sha256(verifier: string): Promise<Uint8Array> {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return new Uint8Array(hashBuffer)
  }

  async generateVerifierChallengePair(): Promise<[string, string]> {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32))
    const verifier = this.base64UrlEncode(randomBytes)
    const challenge = await this.sha256(verifier).then(this.base64UrlEncode)

    return [verifier, challenge]
  }

  private base64UrlEncode(buffer: Uint8Array): string {
    const encoded = Buffer.from(buffer).toString('base64')
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  generateRandomStateOrNonce(): string {
    const randomBytesArray = randomBytes(32)
    return this.base64UrlEncode(randomBytesArray)
  }

  createUrqlClient(
    token: string,
    stitchGraphQL: string,
  ): ReturnType<typeof createClient> {
    const clientOptions: ClientOptions = {
      url: stitchGraphQL,
      fetchOptions: {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        credentials: 'include',
        mode: 'cors',
      },
      exchanges: [cacheExchange, fetchExchange],
    }

    return createClient(clientOptions)
  }

  buildAuthorizationUrl(
    clientId: string,
    challenge: string,
    state: string,
    nonce: string,
    redirectUri: string,
    scopes: string[],
  ): string {
    const search = {
      client_id: clientId,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      response_type: 'code',
      nonce: nonce,
      state: state,
    }
    const searchString = this.createString(search)

    return searchString
  }

  createString(body: object) {
    const bodyString = Object.entries(body)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&')

    return bodyString
  }

  async fetchFromStitch(body: any, secureUrl: string) {
    const bodyString = this.createString(body)

    const response = await fetch(secureUrl, {
      method: 'post',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyString,
    })
    const toJson = await response.json()

    return toJson
  }
}
