import { Role } from "../roles.enum";

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
    provider?: string;
    role: Role;
  };
}
