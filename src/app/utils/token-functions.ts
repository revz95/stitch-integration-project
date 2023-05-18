import { VerifierMapInfo } from 'src/contants/subscription-api.constant'

export class TokenFunctions {
  accessTokens: Map<string, string> = new Map()
  userTokens: Map<string, string> = new Map()
  refreshTokens: Map<string, string> = new Map()
  verifier: Map<string, VerifierMapInfo> = new Map()

  setVerifierInfo(id: string, verifierInfo: VerifierMapInfo): void {
    this.verifier.set(id, verifierInfo)
  }

  getVerifierInfo(id: string): VerifierMapInfo | undefined {
    return this.verifier.get(id)
  }

  setAccessToken(userId: string, token: string): void {
    this.accessTokens.set(userId, token)
  }

  getAccessToken(userId: string): string | undefined {
    return this.accessTokens.get(userId)
  }

  setUserToken(userId: string, token: string): void {
    this.userTokens.set(userId, token)
  }

  getUserToken(userId: string): string | undefined {
    return this.userTokens.get(userId)
  }

  setRefreshToken(userId: string, token: string): void {
    this.refreshTokens.set(userId, token)
  }

  getRefreshToken(userId: string): string | undefined {
    return this.refreshTokens.get(userId)
  }
}
