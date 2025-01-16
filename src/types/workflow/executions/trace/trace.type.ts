import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MinimalConfig, Node } from '../../../services';
import { WorkflowTraceStatistics } from './statistics.type';

@Entity('workflow_traces')
export class WorkflowExecutionTrace {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinColumn()
  @ManyToOne(() => Node)
  node: Node;
  @Column('simple-json')
  input: any;
  @Column('simple-json')
  output: any;
  @Column('simple-json')
  config: any;

  @Column('simple-array')
  warnings: string[] = [];
  @Column('simple-array')
  errors: string[] = [];
  @Column(() => WorkflowTraceStatistics)
  statistics: WorkflowTraceStatistics;

  @JoinColumn()
  @ManyToOne(() => WorkflowExecutionTrace, (trace) => trace.next, {
    nullable: true,
    cascade: true,
    onDelete: 'CASCADE',
  })
  previous?: WorkflowExecutionTrace;

  @JoinColumn()
  @OneToMany(() => WorkflowExecutionTrace, (trace) => trace.previous)
  next: WorkflowExecutionTrace[];

  private data: any;

  private index: number;

  constructor(node: Node, config: MinimalConfig & any) {
    this.node = node;
    this.input = {};
    this.output = {};
    this.config = JSON.parse(JSON.stringify(config || {}));
    this.warnings = [];
    this.errors = [];
    this.statistics = new WorkflowTraceStatistics();
    for (const field of Object.keys(config || {})) {
      if (field === 'user' || field.startsWith('_')) {
        delete this.config[field];
      }
    }
    this.index = 0;
    this.data = {};
  }

  public setData(data: any, index: number): void {
    this.data = data;
    this.index = ++index;
  }

  public addData(newData: any): void {
    this.data[`[${this.index}]`] = {
      ...this.data[`[${this.index}]`],
      ...newData,
    };
  }

  getData() {
    return this.data;
  }

  getIndex() {
    return this.index;
  }

  private processGlobalVariables(path: string): string {
    const pathArray = path.split('.');
    let current: any = {
      currentDate: new Date(),
    };
    for (const p of pathArray) {
      if (p.endsWith(')')) {
        // Call function
        const functionName = p.split('(')[0];
        const functionArgs = p.split('(')[1].slice(0, -1).split(',');
        if (current[functionName] === undefined) {
          return 'undefined';
        }
        if (typeof current[functionName] !== 'function') {
          return 'undefined';
        }
        current = current[functionName](...functionArgs);
        continue;
      }
      if (current[p] === undefined) {
        return 'undefined';
      }
      current = current[p];
    }
    return current;
  }

  private processStringWithVariables(str: string): string {
    const regex =
      /(?<before>[^\\]|^)\${{\[(?<index>\d+)]\.(?<path>[a-zA-Z-_0-9.]+)}}/gm;
    return str.replace(regex, (_match, before, index, path) => {
      const indexInt = parseInt(index, 10);
      if (indexInt >= this.index) {
        return before + 'undefined';
      }
      const data = this.data[`[${index}]`];
      if (!data) {
        return before + 'undefined';
      }
      const pathArray = path.split('.');
      let current = data;
      for (const p of pathArray) {
        if (current[p] === undefined) {
          return before + 'undefined';
        }
        current = current[p];
      }
      const type = typeof current;
      if (type === 'string' || type === 'number' || type === 'boolean') {
        return before + this.safeString(current.toString());
      }
      if (type === 'object') {
        return before + this.safeString(JSON.stringify(current));
      }
      return before + 'undefined';
    });
  }

  private processFunctions(str: string): string {
    const toProcess = [];

    const functions = {
      contains: {
        minArgs: 2,
        maxArgs: 2,
        args: ['string', 'string'],
        func: (str: string, substr: string) => {
          return str.includes(substr) ? '1' : '0';
        },
      },
    };

    for (let i = 0; i < str.length; i++) {
      if (str[i] === '$') {
        if (i !== 0 && str[i - 1] === '\\') {
          continue;
        }
        if (str.length - i < 5) {
          continue;
        }
        if (str[i + 1] !== '{' || str[i + 2] !== '{') {
          continue;
        }
        let j = i + 3;
        let opened = 1;
        while (j < str.length && opened > 0) {
          if (str[j] === '{' && str[j - 1] !== '\\') {
            opened++;
          }
          if (str[j] === '}' && str[j - 1] !== '\\') {
            opened--;
          }
          j++;
        }
        if (j - i < 5) {
          continue;
        }
        toProcess.push(str.substring(i, j + 1));
      }
    }

    for (const process of toProcess) {
      let name = '';
      const args = [];

      for (let i = 3; i < process.length - 3; i++) {
        if (process[i] === '(') {
          break;
        }
        name += process[i];
      }
      let openedBraces = 0;
      let currentArg = '';
      for (let i = name.length + 4; i < process.length - 3; i++) {
        if (process[i] === '(') {
          openedBraces++;
        }
        if (process[i] === ')') {
          openedBraces--;
        }
        if (process[i] === ',' && openedBraces === 0) {
          args.push(currentArg);
          currentArg = '';
          continue;
        }
        currentArg += process[i];
      }
      args.push(currentArg);

      if (functions[name] === undefined) {
        continue;
      }
      if (args.length < functions[name].minArgs) {
        continue;
      }
      if (args.length > functions[name].maxArgs) {
        continue;
      }
      args.map((arg) => this.processGlobalVariables(arg.trim()));
      let valid = true;
      for (let i = 0; i < args.length; i++) {
        if (functions[name].args[i] === 'string') {
          continue;
        }
        if (functions[name].args[i] === 'number') {
          if (isNaN(parseFloat(args[i]))) {
            valid = false;
            break;
          } else {
            args[i] = parseFloat(args[i]);
            continue;
          }
        }
        if (functions[name].args[i] === 'boolean') {
          if (args[i] !== 'true' && args[i] !== 'false') {
            valid = false;
            break;
          } else {
            args[i] = args[i] === 'true';
          }
        }
      }
      if (!valid) {
        continue;
      }
      const result = functions[name].func(...args);
      str = str.replace(process, result);
    }
    return str;
  }

  private processArithmetic(str: string, priority: number = 3): string {
    if (priority < 1) {
      return str;
    }

    const operations = {
      '==': 1,
      '!=': 1,
      '>': 1,
      '<': 1,
      '>=': 1,
      '<=': 1,
      '+': 2,
      '-': 2,
      '*': 3,
      '/': 3,
    };

    const selectedOperations = Object.keys(operations).filter(
      (operation) => operations[operation] === priority,
    );

    // Build regex for the selected operations
    const regex = new RegExp(
      `(?<before>[^\\\\]|^)\\\${{(?<left>[a-zA-Z0-9.]+)\\s*(${selectedOperations
        .map((op) =>
          op === '*'
            ? '\\*'
            : op === '+'
              ? '\\+'
              : op === '-'
                ? '-'
                : op === '/'
                  ? '\\/'
                  : op === '=='
                    ? '=='
                    : op === '!='
                      ? '!='
                      : op === '>'
                        ? '>'
                        : op === '<'
                          ? '<'
                          : op === '>='
                            ? '>='
                            : '<=',
        )
        .join('|')})\\s*(?<right>[a-zA-Z0-9.]+)}}`,
      'gm',
    );

    const iterationsCount = 0;
    let oldStr = '';
    let currentStr = str;
    while (oldStr !== currentStr && iterationsCount < 100) {
      oldStr = currentStr;
      currentStr.replace(regex, (match, before, left, operation, right) => {
        let result = 0;
        switch (operation) {
          case '+':
            result = parseFloat(left) + parseFloat(right);
            break;
          case '-':
            result = parseFloat(left) - parseFloat(right);
            break;
          case '*':
            result = parseFloat(left) * parseFloat(right);
            break;
          case '/':
            result = parseFloat(left) / parseFloat(right);
            break;
          case '==':
          case '!=':
          case '>':
          case '<':
          case '>=':
          case '<=':
            const a = parseFloat(left);
            const b = parseFloat(right);
            if (isNaN(a) || isNaN(b)) {
              switch (operation) {
                case '==':
                  result = left.toString() === right.toString() ? 1 : 0;
                  break;
                case '!=':
                  result = left.toString() !== right.toString() ? 1 : 0;
                  break;
                case '>':
                  result = left.toString() > right.toString() ? 1 : 0;
                  break;
                case '<':
                  result = left.toString() < right.toString() ? 1 : 0;
                  break;
                case '>=':
                  result = left.toString() >= right.toString() ? 1 : 0;
                  break;
                case '<=':
                  result = left.toString() <= right.toString() ? 1 : 0;
                  break;
              }
            } else {
              switch (operation) {
                case '==':
                  result = a === b ? 1 : 0;
                  break;
                case '!=':
                  result = a !== b ? 1 : 0;
                  break;
                case '>':
                  result = a > b ? 1 : 0;
                  break;
                case '<':
                  result = a < b ? 1 : 0;
                  break;
                case '>=':
                  result = a >= b ? 1 : 0;
                  break;
                case '<=':
                  result = a <= b ? 1 : 0;
                  break;
              }
            }
        }
        currentStr = `${before}${result}`;
        return currentStr;
      });
    }

    return this.processArithmetic(currentStr, priority - 1);
  }

  private safeString(str: string): string {
    const regex = /\${{(?<content>[^}]*)}}/gm;
    return str.replace(regex, (_match, content) => {
      return `\\\${{${content}}}`;
    });
  }

  public processPipelineString(str: string): string {
    const withVariables = this.processStringWithVariables(str);
    const withFunctions = this.processFunctions(withVariables);
    const withArithmetic = this.processArithmetic(withFunctions);
    return withArithmetic;
  }
}
