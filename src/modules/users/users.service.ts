import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { FullUser, ListUser, User } from '../../types/user';
import { Repository } from 'typeorm';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class UsersService implements OnModuleInit {
  @Inject()
  private _permissionsService: PermissionsService;

  @Inject('USER_REPOSITORY')
  private _repository: Repository<User>;

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

  private async getFullUserById(
    id: number,
    performer: User,
  ): Promise<FullUser | undefined> {
    if (
      !(await this._permissionsService.can<User>(performer, 'read', id, User))
    ) {
      return undefined;
    }
    const user = await this._repository.findOne({
      where: { id },
    });

    return {
      surname: user.surname,
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  private async getListUserById(
    id: number,
    performer: User,
  ): Promise<ListUser | undefined> {
    if (
      !(await this._permissionsService.can<User>(performer, 'list', id, User))
    ) {
      return undefined;
    }
    const user = await this._repository.findOne({
      where: { id },
    });

    return {
      id: user.id,
      name: user.name,
    };
  }

  async getUserById(
    id: number,
    performer: User,
  ): Promise<FullUser | ListUser | undefined> {
    const fullUser = await this.getFullUserById(id, performer);
    if (fullUser) {
      return fullUser;
    }
    return this.getListUserById(id, performer);
  }
}
