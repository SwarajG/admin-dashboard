import { useState, useEffect, useMemo } from 'react'
import { Users, UserPlus, X } from 'lucide-react'
import type { UserPublic, Role } from '@repo/types'
import { UserRoleTable } from '../components/UserRoleTable'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { toast } from 'sonner'

const ROLE_FILTERS: { label: string; value: Role | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Manager', value: 'MANAGER' },
  { label: 'Employee', value: 'EMPLOYEE' },
  { label: 'Viewer', value: 'VIEWER' },
]

const ROLES: Role[] = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']

function AddUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE' as Role })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await api.post('/users', form)
      toast.success(`User ${form.name} added successfully`)
      onSuccess()
      onClose()
    } catch {
      // error toast handled globally
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Add User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="John Doe"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="user@example.com"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 8 characters"
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              disabled={isLoading}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AdminUsers() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserPublic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL')
  const [showAddModal, setShowAddModal] = useState(false)

  const fetchUsers = () => {
    setIsLoading(true)
    api
      .get('/users')
      .then((res) => setUsers(res.data.users))
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
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-gray-700" />
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          </div>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          )}
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

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchUsers}
        />
      )}
    </div>
  )
}
