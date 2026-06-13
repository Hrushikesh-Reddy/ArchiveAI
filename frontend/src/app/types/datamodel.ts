import { Timestamp } from "next/dist/server/lib/cache-handlers/types";

export interface Message {
    input: {
        prompt: string;
        file: File | string | null;
    };
    response: string;
    status: string//"STARTED" | "COMPLETED" | "ERROR" | "STOPPED" | "INPROGRESS";
}

export interface User {
    id: string
    auth0_id: string
    name:string
    email:string
    password:string
    created_at: Timestamp | null
}

export interface Input {
    prompt: string;
    file: File | null
}

export interface Response {
    message: string
    status: boolean
    data: any
}

export interface Session {
  id: string
  name: string
  user_id: string
  created_at: Timestamp
  updated_at: Timestamp
}