import { Inject, Injectable } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import {
  Condition,
  Effect,
  IdOf,
  Policy,
  Resource,
  ResourceType,
  Rule,
} from '../../types/permissions';
import { User } from '../../types/user';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PermissionsService {
  @InjectRepository(Policy)
  private readonly _policiesRepository: Repository<Policy>;

  @InjectRepository(Rule)
  private readonly _rulesRepository: Repository<Rule<Resource>>;

  @InjectRepository(User)
  private readonly _usersRepository: Repository<User>;

  constructor(@Inject() private _resourcesService: ResourcesService) {
    this._resourcesService = _resourcesService;
  }

  // ABAC

  async can<T extends Resource>(
    user: User,
    action: string,
    resourceId: IdOf<T> | null,
    resourceType: ResourceType,
    ctx?: any,
  ): Promise<boolean> {
    const policies = await this._policiesRepository.find({
      where: {
        users: {
          id: user.id,
        },
      },
      relations: ['rules'],
    });

    if (policies.length === 0) {
      console.error('No policies found for:', {
        user: user.id,
        action: action.toString(),
        resourceType: resourceType.resourceName,
      });
      return false;
    }

    const policiesWithRules = policies.map((policy) => ({
      id: policy.id,
      rules: policy.rules.map((rule) => ({
        id: rule.id,
        action: rule.action,
        resourceType: rule.resourceType,
        condition: new Function(`return ${rule.condition}`)() as Condition<T>,
        effect: rule.effect,
      })),
    }));

    const resource = resourceId
      ? await this._resourcesService.getResource(resourceId, resourceType)
      : null;

    if (resource === null && resourceId !== null) {
      console.error("Resource doesn't exist");
      return false;
    }

    if (policiesWithRules.length === 0) {
      console.error('No policies with rules found');
      return false;
    }

    for (const policy of policiesWithRules) {
      if (policy.rules.length === 0) {
        console.error('Policy has no rules');
        return false;
      }
      for (const rule of policy.rules) {
        if (
          rule.action === action.toString() &&
          rule.resourceType === resourceType.resourceName
        ) {
          if (rule.condition(user, resource, ctx)) {
            return rule.effect === 'allow';
          }
        }
      }
    }

    console.error('No matching rule found');

    return false;
  }

  async createPolicy(name: string): Promise<IdOf<Policy>> {
    if (name === '') {
      throw new Error('Policy name cannot be empty');
    }
    const existingPolicy = await this._policiesRepository.findOne({
      where: { id: name },
    });
    if (existingPolicy) {
      return existingPolicy.id;
    }
    return (
      await this._policiesRepository.insert({
        id: name,
      })
    ).identifiers[0].id;
  }

  async addRuleToPolicy<T extends Resource>(
    policyId: IdOf<Policy>,
    action: string,
    resourceType: ResourceType,
    condition: Condition<T>,
    effect: Effect,
  ): Promise<IdOf<Rule<T>>> {
    const actionString = action.toString();
    if (actionString === '') {
      throw new Error('Action cannot be empty');
    }
    // @ts-expect-error Fuck ts
    const test = new (resourceType as unknown as T)();
    if (!test.actions) {
      throw new Error(
        'Resource ' +
          resourceType.resourceName +
          " is missing decorator @Actions or it's empty",
      );
    }
    if (test.actions.indexOf(actionString) === -1) {
      throw new Error(
        'Resource ' +
          resourceType.resourceName +
          " doesn't have such action as " +
          actionString,
      );
    }
    const rule = await this._rulesRepository.findOne({
      where: {
        action: actionString,
        resourceType: resourceType.resourceName,
        effect,
      },
    });
    if (rule) {
      rule.condition = condition.toString();
      await this._rulesRepository.save(rule);
      return rule.id;
    }
    const id = (
      await this._rulesRepository.save({
        action: actionString,
        resourceType: resourceType.resourceName,
        condition: condition.toString(),
        effect,
        policy: { id: policyId },
      })
    ).id;
    if (!id) {
      throw new Error('Failed to create rule');
    }
    return id;
  }

  async addPolicyToUser(
    userId: IdOf<User>,
    policyId: IdOf<Policy>,
  ): Promise<void> {
    const user = await this._usersRepository.findOne({
      where: { id: userId },
      relations: ['policies'],
    });
    const policy = await this._policiesRepository.findOne({
      where: { id: policyId },
    });
    if (!user || !policy) {
      throw new Error('User or policy not found');
    }
    if (!user.policies) {
      user.policies = [];
    }
    if (!policy.users) {
      policy.users = [];
    }
    policy.users.push(user);
    await this._policiesRepository.save(policy);
  }

  async removePolicyFromUser(
    userId: IdOf<User>,
    policyId: IdOf<Policy>,
  ): Promise<void> {
    const user = await this._usersRepository.findOne({
      where: { id: userId },
      relations: ['policies'],
    });
    const policy = await this._policiesRepository.findOne({
      where: { id: policyId },
    });
    if (!user || !policy) {
      throw new Error('User or policy not found');
    }
    policy.users = policy.users.filter((u) => u.id !== user.id);
    await this._policiesRepository.save(policy);
  }

  async removeRule(ruleId: IdOf<Rule<Resource>>): Promise<void> {
    await this._rulesRepository.delete({ id: ruleId });
  }
}
