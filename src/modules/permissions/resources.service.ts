import { Inject, Injectable } from '@nestjs/common';
import { IdOf, Resource } from '../../types/permissions';
import { DataSource } from 'typeorm';

@Injectable()
export class ResourcesService {
  @Inject('DATA_SOURCE')
  private readonly _databaseService: DataSource;

  getResource = async <T extends Resource>(
    resourceId: IdOf<T>,
    resourceType: typeof Resource & { resourceName: string },
  ): Promise<T | null> => {
    // Derive the resource name based on the type
    const resourceName = resourceType.resourceName;
    const relations = this._databaseService
      .getRepository(resourceName)
      .metadata.relations.map((relation) => relation.propertyName);
    return (await this._databaseService.getRepository(resourceName).findOne({
      where: { id: resourceId },
      relations,
    })) as Promise<T>;
  };
}
