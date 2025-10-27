import { UserData } from './user-data.type';

export type AuthResponse = {
  status: number;
  message: string;
  data?: AuthData;
};

export type AuthData = {
  user: UserData;
  access_token: string;
};

export type UserCreatedResponse = {
  status: 201;
  message: string;
  data: UserData;
};

