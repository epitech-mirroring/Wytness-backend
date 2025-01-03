export enum FieldType {
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    BOOLEAN = 'BOOLEAN',
    DATE = 'DATE',
}

export class Field {
    title: string;
    name: string;
    description: string;
    type: FieldType;
    nullable: boolean;

    constructor(title: string, name: string, description: string, type: FieldType, nullable: boolean) {
        this.title = title;
        this.name = name;
        this.description = description;
        this.type = type;
        this.nullable = nullable;
    }
}
