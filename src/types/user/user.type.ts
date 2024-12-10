import { Credential } from "../index";

export class User {
    id: number;
    email: string;
    name: string;
    surname: string;
    credentials: Credential[];
    createdAt: Date;
    updatedAt: Date;
}
