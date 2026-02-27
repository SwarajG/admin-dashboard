import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  UserPlus,
  UserMinus,
  Search,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import type { UserPublic } from '@repo/types'
import { useProject } from '../hooks/useProjects'
import { useAuth } from '../context/AuthContext'
import { StatusBadge } from '../components/StatusBadge'
import { DeadlineIndicator } from '../components/DeadlineIndicator'
import { MemberAvatarList } from '../components/MemberAvatarList'
import { BlockerList } from '../components/BlockerList'
import { ReminderForm } from '../components/ReminderForm'
import { RoleGuard } from '../components/RoleGuard'
import api from '../services/api'
import { format } from 'date-fns'

type Tab = 'overview' | 'members' | 'reminders' | 'blockers'

const STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DONE', label: 'Done' },
] as const

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { project, isLoading, error, refetch } = useProject(id ?? '')
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState<UserPublic[]>([])
  const [searching, setSearching] = useState(false)
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <p className="text-gray-500 mb-4">{error ?? 'Project not found'}</p>
        <Link to="/projects" className="text-blue-600 hover:underline text-sm">
          Back to projects
        </Link>
      </div>
    )
  }

  const isOwner = user?.id === project.ownerId
  const isMember = project.members.some((m) => m.userId === user?.id)
  const canEdit =
    user?.role === 'ADMIN' ||
    (user?.role === 'MANAGER' && isOwner)
  const canUpdateStatus =
    user?.role === 'ADMIN' ||
    user?.role === 'MANAGER' ||
    (user?.role === 'EMPLOYEE' && isMember)
  const canDelete = user?.role === 'ADMIN' || (user?.role === 'MANAGER' && isOwner)

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true)
    try {
      await api.patch(`/projects/${project.id}/status`, { status: newStatus })
      toast.success('Status updated')
      refetch()
    } catch {
      // handled globally
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await api.delete(`/projects/${project.id}`)
      toast.success('Project deleted')
      navigate('/projects', { replace: true })
    } catch {
      // handled globally
    } finally {
      setDeleting(false)
    }
  }

  const handleSearchUsers = async () => {
    if (!userSearch.trim()) return
    setSearching(true)
    try {
      const res = await api.get('/users', { params: { search: userSearch.trim() } })
      const allUsers: UserPublic[] = res.data.users
      const memberIds = new Set(project.members.map((m) => m.userId))
      setSearchResults(allUsers.filter((u) => !memberIds.has(u.id)))
    } catch {
      // handled globally
    } finally {
      setSearching(false)
    }
  }

  const handleAddMember = async (userId: string) => {
    setAddingMemberId(userId)
    try {
      await api.post(`/projects/${project.id}/members`, { userId })
      toast.success('Member added')
      setSearchResults((prev) => prev.filter((u) => u.id !== userId))
      refetch()
    } catch {
      // handled globally
    } finally {
      setAddingMemberId(null)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Remove this member from the project?')) return
    setRemovingMemberId(userId)
    try {
      await api.delete(`/projects/${project.id}/members/${userId}`)
      toast.success('Member removed')
      refetch()
    } catch {
      // handled globally
    } finally {
      setRemovingMemberId(null)
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'members', label: `Members (${project.members.length})` },
    { key: 'reminders', label: `Reminders (${project.reminders.length})` },
    { key: 'blockers', label: `Blockers (${project.blockers.length})` },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to projects
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          {project.description && (
            <p className="text-sm text-gray-600 mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {canEdit && (
            <Link
              to={`/projects/${project.id}/edit`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Link>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px gap-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Deadline
              </p>
              <DeadlineIndicator
                deadline={project.deadline}
                daysUntilDeadline={project.daysUntilDeadline}
                status={project.status}
              />
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Owner
              </p>
              <p className="text-sm font-medium text-gray-900">{project.owner.name}</p>
              <p className="text-xs text-gray-500">{project.owner.email}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Members
              </p>
              <div className="flex items-center gap-2">
                <MemberAvatarList members={project.members} />
                <span className="text-sm text-gray-500">{project.memberCount} member{project.memberCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Created
              </p>
              <p className="text-sm text-gray-700">
                {format(new Date(project.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          {canUpdateStatus && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Update Status
              </p>
              <div className="relative inline-block">
                <select
                  value={project.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updatingStatus}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50 bg-white cursor-pointer"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {updatingStatus && <span className="ml-2 text-xs text-gray-400">Saving...</span>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Current members */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Current Members ({project.members.length})
            </h3>
            {project.members.length === 0 ? (
              <p className="text-sm text-gray-400">No members assigned yet.</p>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                {project.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center font-semibold">
                        {member.user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {member.user.name}
                          {member.userId === project.ownerId && (
                            <span className="ml-2 text-xs text-blue-500">Owner</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{member.user.role}</span>
                      <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
                        {member.userId !== project.ownerId && (
                          <button
                            onClick={() => handleRemoveMember(member.userId)}
                            disabled={removingMemberId === member.userId}
                            title="Remove member"
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </RoleGuard>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add member */}
          <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add Member
              </h3>
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <button
                  onClick={handleSearchUsers}
                  disabled={searching || !userSearch.trim()}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                      <button
                        onClick={() => handleAddMember(u.id)}
                        disabled={addingMemberId === u.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        {addingMemberId === u.id ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {searchResults.length === 0 && userSearch && !searching && (
                <p className="text-sm text-gray-400">No users found or all are already members.</p>
              )}
            </div>
          </RoleGuard>
        </div>
      )}

      {activeTab === 'reminders' && (
        <ReminderForm
          projectId={project.id}
          reminders={project.reminders}
          canEdit={canEdit || isMember}
          onRefresh={refetch}
        />
      )}

      {activeTab === 'blockers' && (
        <BlockerList
          projectId={project.id}
          blockers={project.blockers}
          canEdit={canEdit || isMember}
          onRefresh={refetch}
        />
      )}
    </div>
  )
}
