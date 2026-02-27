export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'VIEWER'

export interface UserPublic {
  id: string
  name: string
  email: string
  role: Role
  isActive: boolean
  createdAt: string
}

export interface AuthUser extends UserPublic {}

export interface LoginResponse {
  token: string
  user: UserPublic
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}
