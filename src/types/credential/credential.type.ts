import { ServiceType } from "@prisma/client";

export class Credential {
    id: number;
    userId: number;
    serviceType: ServiceType;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
