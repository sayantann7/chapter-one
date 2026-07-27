export interface AccessTokenPayload {
  sub: string;
  email: string | null;
  status: string;
  role: string;
  jti?: string;
  iss?: string;
  aud?: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  familyId: string;
  tokenId: string;
}
