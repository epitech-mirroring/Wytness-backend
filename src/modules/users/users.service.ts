import { Injectable } from '@nestjs/common';
import { User } from '../../types/user';
import { PrismaService } from '../../providers/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    return this.prisma.user.findMany();
  }

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

  async createUser(email: string, name: string, surname: string) {
    return this.prisma.user.create({
      data: {
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
