import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { User } from '../../types/user';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class UsersService implements OnModuleInit {
  @Inject()
  private _permissionsService: PermissionsService;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const globalPolicy = await this._permissionsService.createPolicy('User');

    await this._permissionsService.addRuleToPolicy<User>(
      globalPolicy,
      'read',
      User,
      (user, targetUser) => user.id === targetUser?.id,
      'allow',
    );
  }

  async getAllUsers() {
    return this.prisma.user.findMany();
  }

  async getUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async getUserByFirebaseId(firebaseId: string) {
    return this.prisma.user.findUnique({
      where: { firebaseId },
    });
  }

  async getUserByEmail(email: string, performer: Omit<User, 'actions'>) {
    const userId = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (
      !(await this._permissionsService.canUserPerformAction(
        performer,
        'read',
        userId.id,
        User,
      ))
    ) {
      return null;
    }
    return this.prisma.user.findUnique({
      where: { id: userId.id },
    });
  }

  async createUser(
    firebaseId: string,
    email: string,
    name: string,
    surname: string,
  ) {
    return this.prisma.user.create({
      data: {
        firebaseId,
        email,
        name,
        surname,
      },
    });
  }

  async updateUser(id: number, data: Partial<User>) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: number) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
