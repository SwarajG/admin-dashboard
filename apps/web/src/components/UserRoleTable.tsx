import { useState } from 'react'
import { toast } from 'sonner'
import type { UserPublic, Role } from '@repo/types'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const ROLES: Role[] = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']

interface UserRoleTableProps {
  users: UserPublic[]
  onRefresh: () => void
}

export function UserRoleTable({ users, onRefresh }: UserRoleTableProps) {
  const { user: currentUser } = useAuth()
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  const handleRoleChange = async (userId: string, newRole: Role) => {
    setUpdatingRoleId(userId)
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole })
      toast.success('User role updated')
      onRefresh()
    } catch {
      // error handled globally
    } finally {
      setUpdatingRoleId(null)
    }
  }

  const handleStatusToggle = async (user: UserPublic) => {
    setUpdatingStatusId(user.id)
    try {
      await api.patch(`/users/${user.id}/status`, { isActive: !user.isActive })
      toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'}`)
      onRefresh()
    } catch {
      // error handled globally
    } finally {
      setUpdatingStatusId(null)
    }
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <p>No users found.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {users.map((user) => {
            const isCurrentUser = currentUser?.id === user.id
            const isUpdatingRole = updatingRoleId === user.id
            const isUpdatingStatus = updatingStatusId === user.id

            return (
              <tr
                key={user.id}
                className={isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 text-white text-xs flex items-center justify-center font-semibold flex-shrink-0">
                      {user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      {isCurrentUser && (
                        <p className="text-xs text-blue-500">You</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isCurrentUser ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {user.role}
                    </span>
                  ) : (
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                      disabled={isUpdatingRole}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 bg-white"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      user.isActive
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isCurrentUser ? (
                    <span className="text-xs text-gray-400">—</span>
                  ) : (
                    <button
                      onClick={() => handleStatusToggle(user)}
                      disabled={isUpdatingStatus}
                      className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 ${
                        user.isActive
                          ? 'text-red-600 bg-red-50 hover:bg-red-100'
                          : 'text-green-600 bg-green-50 hover:bg-green-100'
                      }`}
                    >
                      {isUpdatingStatus
                        ? 'Updating...'
                        : user.isActive
                          ? 'Deactivate'
                          : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
