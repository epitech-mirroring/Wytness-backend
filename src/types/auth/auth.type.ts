import { DecodedIdToken } from 'firebase-admin/lib/auth';

export type TokenPayload = {} & DecodedIdToken;
