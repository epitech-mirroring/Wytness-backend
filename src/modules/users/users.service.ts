import { Injectable } from '@nestjs/common';
import { User, Credential } from '../../types/index';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { ServiceType } from '@prisma/client';
import { deleteUser } from '@firebase/auth';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    async getUserById(id: number) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async getUserByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async createUser(email : string, name: string, surname: string) {
        return this.prisma.user.create({
            data: {
                email,
                name,
                surname,
            },
        });
    }

    async addUserCredentials(email: string, ServiceType: ServiceType, accessToken: string, refreshToken: string, expiresAt: Date) {
        const user = await this.getUserByEmail(email);
        if (!user) {
            return null;
        }
        const { id } = user;

        if (await this.getUserCredentialByServiceType(email, ServiceType)) {
            return null;
        }
        return this.prisma.credential.create({
            data: {
                userId: id,
                serviceType: ServiceType,
                accessToken,
                refreshToken,
                expiresAt,
            },
        });
    }

    async getUserCredentials(email: string) {
        const user = await this.getUserByEmail(email);
        if (!user) {
            return null;
        }
        const { id } = user;
        return this.prisma.credential.findMany({
            where: { userId: id },
        });
    }

    async getUserCredentialByServiceType(email: string, serviceType: ServiceType) {
        const user = await this.getUserByEmail(email);
        if (!user) {
            return null;
        }
        const { id } = user;
        return this.prisma.credential.findFirst({
            where: { userId: id, serviceType },
        });
    }

    async deleteUserCredentialById(id: number) {
        return this.prisma.credential.delete({
            where: { id },
        });
    }

    async updateUserCredentialById(id: number, accessToken: string, refreshToken: string, expiresAt: Date) {
        return this.prisma.credential.update({
            where: { id },
            data: {
                accessToken,
                refreshToken,
                expiresAt,
            },
        });
    }

    async hasUserCredential(email: string, serviceType: ServiceType) {
        return this.getUserCredentialByServiceType(email, serviceType) !== null;
    }
}
