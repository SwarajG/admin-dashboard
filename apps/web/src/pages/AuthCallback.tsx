import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export function AuthCallback() {
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      toast.error('Authentication failed. No token received.')
      navigate('/login', { replace: true })
      return
    }

    // Temporarily set the token in localStorage so the api interceptor picks it up
    localStorage.setItem('token', token)

    api
      .get('/auth/me')
      .then((res) => {
        login(token, res.data.user)
        toast.success(`Welcome, ${res.data.user.name}!`)
        navigate('/dashboard', { replace: true })
      })
      .catch(() => {
        localStorage.removeItem('token')
        toast.error('Authentication failed. Please try again.')
        navigate('/login', { replace: true })
      })
  }, [searchParams, login, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin h-10 w-10 border-4 border-gray-900 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm text-gray-500">Completing sign in...</p>
      </div>
    </div>
  )
}
