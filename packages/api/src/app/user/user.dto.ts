export interface CreateUserDto {
  name: string;
  displayName: string;
  email: string;
  role?: string | null;
  skillMatrix?: string | null;
  isAvailable?: boolean;
}

export interface UpdateUserDto {
  name?: string;
  displayName?: string;
  email?: string;
  role?: string | null;
  skillMatrix?: string | null;
  isAvailable?: boolean;
}

export interface DeleteUsersDto {
  ids: number[];
}
