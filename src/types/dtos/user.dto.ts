export interface RegisterUserBody {
  fullName: string;
  email: string;
  username: string;
  password: string;
}


export interface LoginUserBody {
  email?: string;
  username?: string;
  password: string;
}