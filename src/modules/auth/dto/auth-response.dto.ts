import { Role } from "../../../common/enums/role.enum";

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
