export interface ILoginPayload {
  email?: string;
  username?: string;
  password: string;
}

export interface ILoginResponse {
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface IRegisterPayload {
  name: string;
  email: string;
  password: string;
}
