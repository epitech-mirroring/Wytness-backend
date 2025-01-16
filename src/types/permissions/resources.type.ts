export abstract class Resource {
  id: number;

  static resourceName: string;
}

export type ResourceType = typeof Resource & { resourceName: string };

export type IdOf<T> = T extends { id: infer U } ? U : never;

export function Actions(...actions: string[]): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return function (constructor: Function) {
    constructor.prototype.actions = actions;
  };
}
