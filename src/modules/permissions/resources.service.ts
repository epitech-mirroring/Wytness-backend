import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { IdOf, PrismaTableName, Resource } from '../../types/permissions';

@Injectable()
export class ResourcesService {
  constructor(@Inject() private _prismaService: PrismaService) {}

  getResource = async <T extends Resource>(
    resourceId: IdOf<T>,
    resourceType: typeof Resource & { resourceName: PrismaTableName },
  ): Promise<T | null> => {
    // Derive the resource name based on the type
    const resourceName = resourceType.resourceName;

    return this._prismaService[resourceName].findUnique({
      where: { id: resourceId },
    });
  };
}
