import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { UserPublic, OrgDto } from '@repo/types'
import api from '../services/api'

interface AuthContextType {
  user: UserPublic | null
  org: OrgDto | null
  token: string | null
  isLoading: boolean
  login: (token: string, user: UserPublic, org?: OrgDto) => void
  logout: () => void
  updateUser: (user: UserPublic) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null)
  const [org, setOrg] = useState<OrgDto | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      Promise.all([api.get('/auth/me'), api.get('/orgs/me')])
        .then(([userRes, orgRes]) => {
          setUser(userRes.data.user)
          setOrg(orgRes.data.org)
        })
        .catch(() => {
          localStorage.removeItem('token')
          setToken(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = (newToken: string, newUser: UserPublic, newOrg?: OrgDto) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(newUser)
    if (newOrg) {
      setOrg(newOrg)
    } else {
      api.get('/orgs/me').then((res) => setOrg(res.data.org)).catch(() => {})
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setOrg(null)
    api.post('/auth/logout').catch(() => {})
  }

  const updateUser = (updatedUser: UserPublic) => setUser(updatedUser)

  return (
    <AuthContext.Provider value={{ user, org, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
