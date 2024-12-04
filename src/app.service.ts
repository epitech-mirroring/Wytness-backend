import { Injectable } from '@nestjs/common';
import { PrismaService } from './providers/prisma/prisma.service';

@Injectable()
export class AppService {
  // Exemple of how to use injected PrismaService
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    // Exemple of how to use injected PrismaService
    this.prisma.user.findMany().then((users) => {
      console.log(users);
    });
    return 'Hello World!';
  }
}
