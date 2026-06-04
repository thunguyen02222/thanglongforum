export interface IUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  username?: string;
  userCode?: string;
  role: string;
  status: string;
  classId?: string;
  avatarId?: string;
  avatarUrl?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  department?: string;
  major?: string;
}

export interface IUserCreatePayload {
  firstName?: string;
  lastName?: string;
  name: string;
  username?: string;
  email: string;
  password?: string;
  userCode?: string;
  role?: string;
  status?: string;
  classId?: string;
  avatarId?: string;
  department?: string;
  major?: string;
}

export interface IUserUpdatePayload {
  firstName?: string;
  lastName?: string;
  name?: string;
  username?: string;
  email?: string;
  userCode?: string;
  role?: string;
  status?: string;
  classId?: string;
  avatarId?: string;
  phone?: string;
  department?: string;
  major?: string;
}
