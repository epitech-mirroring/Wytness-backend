import { Field } from "src/types/services/field.type";

export class NodeDTO {
  id: number;
  name: string;
  description: string;
  type: string;
  fields: Field[];
}