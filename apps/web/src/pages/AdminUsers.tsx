import { useState, useEffect, useMemo } from 'react'
import { Users } from 'lucide-react'
import type { UserPublic, Role } from '@repo/types'
import { UserRoleTable } from '../components/UserRoleTable'
import api from '../services/api'

const ROLE_FILTERS: { label: string; value: Role | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Manager', value: 'MANAGER' },
  { label: 'Employee', value: 'EMPLOYEE' },
  { label: 'Viewer', value: 'VIEWER' },
]

export function AdminUsers() {
  const [users, setUsers] = useState<UserPublic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL')

  const fetchUsers = () => {
    setIsLoading(true)
    api
      .get('/users')
      .then((res) => setUsers(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filtered = useMemo(() => {
    if (roleFilter === 'ALL') return users
    return users.filter((u) => u.role === roleFilter)
  }, [users, roleFilter])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Users className="w-6 h-6 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        </div>
        <p className="text-sm text-gray-500">
          {isLoading
            ? 'Loading...'
            : `${users.length} total user${users.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Role filter buttons */}
      <div className="flex gap-2 flex-wrap mb-6">
        {ROLE_FILTERS.map((f) => {
          const count =
            f.value === 'ALL'
              ? users.length
              : users.filter((u) => u.role === f.value).length
          return (
            <button
              key={f.value}
              onClick={() => setRoleFilter(f.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                roleFilter === f.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200 animate-pulse">
          <div className="min-w-full">
            <div className="bg-gray-50 h-12 rounded-t-lg" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 border-t border-gray-100 px-6 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-48 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <UserRoleTable users={filtered} onRefresh={fetchUsers} />
      )}
    </div>
  )
}
