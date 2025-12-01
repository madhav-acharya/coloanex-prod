import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PrismaService } from '../../prisma.service';

type UniqueWhere = Record<string, unknown>;

@Injectable()
@ValidatorConstraint({ name: 'IsUniqueConstraint', async: true })
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(value: unknown, args: ValidationArguments): Promise<boolean> {
    if (value === null || value === undefined || value === '') return true;

    const [model, field, options] = args.constraints as [
      string,
      string,
      {
        excludeIdField?: string;
        excludeIdValuePath?: string;
      }?,
    ];
    const repo = this.prisma[model] as {
      findFirst?: (args: { where: UniqueWhere }) => Promise<unknown>;
    };
    if (!repo || typeof repo.findFirst !== 'function') return false;

    const where: UniqueWhere = { [field]: value };
    if (options?.excludeIdField && options?.excludeIdValuePath) {
      const obj = args.object as Record<string, unknown>;
      const idValue =
        options.excludeIdValuePath && obj
          ? obj[options.excludeIdValuePath]
          : undefined;
      if (idValue !== undefined && idValue !== null) {
        where.NOT = { [options.excludeIdField]: idValue };
      }
    }

    const existing = await repo.findFirst({ where });
    return !existing;
  }

  defaultMessage(args: ValidationArguments) {
    const [model, field] = args.constraints as [string, string];
    return `${field} must be unique in ${model}`;
  }
}

export function IsUnique(
  model: string,
  field: string,
  options?: {
    excludeIdField?: string;
    excludeIdValuePath?: string;
  },
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsUnique',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [model as any, field, options],
      validator: IsUniqueConstraint,
    });
  };
}
