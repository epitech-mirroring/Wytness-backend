import { Injectable } from '@nestjs/common';
import { IdOf, User } from '../../types';
import { PrismaService } from '../../providers/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    return this.prisma.user.findMany();
  }

  async getUserById(id: IdOf<User>) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async getUserByFirebaseId(firebaseId: string) {
    return this.prisma.user.findUnique({
      where: { firebaseId },
    });
  }

  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
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
