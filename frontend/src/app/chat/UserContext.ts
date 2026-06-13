"use client"
import { createContext } from "react";
import {User} from "@/app/types/datamodel"

export const UserContext = createContext<User|null>(null);