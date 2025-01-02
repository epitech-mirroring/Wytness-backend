import { Inject, Injectable } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { PrismaService } from '../../providers/prisma/prisma.service';
import {
  Condition,
  Effect,
  IdOf,
  Policy,
  Resource,
  ResourceType,
  Rule,
} from '../../types/permissions';
import { Effect as PrismaEffect } from '@prisma/client';
import { User } from '../../types/user';

@Injectable()
export class PermissionsService {
  constructor(
    @Inject() private _prismaService: PrismaService,
    @Inject() private _resourcesService: ResourcesService,
  ) {
    this._prismaService = _prismaService;
    this._resourcesService = _resourcesService;
  }

  private prismaEffectToEffect(effect: PrismaEffect): Effect {
    return effect === 'ALLOW' ? 'allow' : 'deny';
  }

  private effectToPrismaEffect(effect: Effect): PrismaEffect {
    return effect === 'allow' ? 'ALLOW' : 'DENY';
  }

  // ABAC

  async canUserPerformAction<T extends Resource>(
    user: Omit<User, 'actions'>,
    action: T['actions'],
    resourceId: IdOf<T> | null,
    resourceType: ResourceType,
    ctx?: any,
  ): Promise<boolean> {
    const policies = await this._prismaService.policy.findMany({
      where: {
        users: {
          some: {
            id: user.id,
          },
        },
        rules: {
          some: {
            AND: {
              action: action.toString(),
              resourceType: resourceType.resourceName,
            },
          },
        },
      },
      include: {
        rules: true,
      },
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
        effect: this.prismaEffectToEffect(rule.effect),
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
    const existingPolicy = await this._prismaService.policy.findUnique({
      where: { id: name },
    });
    if (existingPolicy) {
      return existingPolicy.id;
    }
    return (
      await this._prismaService.policy.create({
        data: {
          id: name,
        },
        select: {
          id: true,
        },
      })
    ).id;
  }

  async addRuleToPolicy<T extends Resource>(
    policyId: IdOf<Policy>,
    action: T['actions'],
    resourceType: ResourceType,
    condition: Condition<T>,
    effect: Effect,
  ): Promise<IdOf<Rule<T>>> {
    const actionString = action.toString();
    const id = (
      await this._prismaService.rule.upsert({
        where: {
          action_resourceType_effect_policyId: {
            action,
            resourceType: resourceType.resourceName,
            effect: this.effectToPrismaEffect(effect),
            policyId,
          },
        },
        create: {
          resourceType: resourceType.resourceName,
          action: actionString,
          condition: condition.toString(),
          effect: this.effectToPrismaEffect(effect),
          policy: {
            connect: {
              id: policyId,
            },
          },
        },
        update: {
          condition: condition.toString(),
        },
        select: {
          id: true,
        },
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
    await this._prismaService.user.update({
      where: { id: userId },
      data: {
        policies: {
          connect: {
            id: policyId,
          },
        },
      },
    });
  }

  async removePolicyFromUser(
    userId: IdOf<User>,
    policyId: IdOf<Policy>,
  ): Promise<void> {
    await this._prismaService.user.update({
      where: { id: userId },
      data: {
        policies: {
          disconnect: {
            id: policyId,
          },
        },
      },
    });
  }

  async removeRuleFromPolicy(ruleId: IdOf<Rule<Resource>>): Promise<void> {
    await this._prismaService.rule.delete({
      where: { id: ruleId },
    });
  }
}
