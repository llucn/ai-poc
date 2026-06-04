export interface CreateUserDto {
  name: string;
  displayName: string;
  email: string;
  role?: string | null;
  skillMatrix?: string | null;
  isAvailable?: number;
}

export interface UpdateUserDto {
  name?: string;
  displayName?: string;
  email?: string;
  role?: string | null;
  skillMatrix?: string | null;
  isAvailable?: number;
}

export interface DeleteUsersDto {
  ids: number[];
}
