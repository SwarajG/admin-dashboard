import { useState } from 'react'
import { PlusCircle, CheckCircle, XCircle, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import type { BlockerDto } from '@repo/types'
import api from '../services/api'

interface BlockerListProps {
  projectId: string
  blockers: BlockerDto[]
  canEdit: boolean
  onRefresh: () => void
}

export function BlockerList({ projectId, blockers, canEdit, onRefresh }: BlockerListProps) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/projects/${projectId}/blockers`, {
        title: title.trim(),
        description: description.trim() || undefined,
      })
      toast.success('Blocker added')
      setTitle('')
      setDescription('')
      setShowForm(false)
      onRefresh()
    } catch {
      // error toast handled globally
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (blocker: BlockerDto) => {
    setTogglingId(blocker.id)
    const newStatus = blocker.status === 'OPEN' ? 'RESOLVED' : 'OPEN'
    try {
      await api.patch(`/projects/${projectId}/blockers/${blocker.id}`, { status: newStatus })
      toast.success(`Blocker marked as ${newStatus.toLowerCase()}`)
      onRefresh()
    } catch {
      // error toast handled globally
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (blockerId: string) => {
    if (!confirm('Delete this blocker?')) return
    setDeletingId(blockerId)
    try {
      await api.delete(`/projects/${projectId}/blockers/${blockerId}`)
      toast.success('Blocker deleted')
      onRefresh()
    } catch {
      // error toast handled globally
    } finally {
      setDeletingId(null)
    }
  }

  const openBlockers = blockers.filter((b) => b.status === 'OPEN')
  const resolvedBlockers = blockers.filter((b) => b.status === 'RESOLVED')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-gray-900">
            Blockers{' '}
            {openBlockers.length > 0 && (
              <span className="ml-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {openBlockers.length} open
              </span>
            )}
          </h3>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <PlusCircle className="w-4 h-4" />
            Add Blocker
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Describe the blocker..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more details..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              disabled={submitting}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Blocker'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setTitle('')
                setDescription('')
              }}
              className="px-4 py-2 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {blockers.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No blockers reported</p>
        </div>
      ) : (
        <div className="space-y-4">
          {openBlockers.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">
                Open
              </p>
              <div className="space-y-2">
                {openBlockers.map((blocker) => (
                  <BlockerItem
                    key={blocker.id}
                    blocker={blocker}
                    canEdit={canEdit}
                    isToggling={togglingId === blocker.id}
                    isDeleting={deletingId === blocker.id}
                    onToggle={() => handleToggleStatus(blocker)}
                    onDelete={() => handleDelete(blocker.id)}
                  />
                ))}
              </div>
            </div>
          )}
          {resolvedBlockers.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">
                Resolved
              </p>
              <div className="space-y-2">
                {resolvedBlockers.map((blocker) => (
                  <BlockerItem
                    key={blocker.id}
                    blocker={blocker}
                    canEdit={canEdit}
                    isToggling={togglingId === blocker.id}
                    isDeleting={deletingId === blocker.id}
                    onToggle={() => handleToggleStatus(blocker)}
                    onDelete={() => handleDelete(blocker.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface BlockerItemProps {
  blocker: BlockerDto
  canEdit: boolean
  isToggling: boolean
  isDeleting: boolean
  onToggle: () => void
  onDelete: () => void
}

function BlockerItem({
  blocker,
  canEdit,
  isToggling,
  isDeleting,
  onToggle,
  onDelete,
}: BlockerItemProps) {
  const isOpen = blocker.status === 'OPEN'

  return (
    <div
      className={`rounded-lg border p-4 ${
        isOpen ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                isOpen
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-green-100 text-green-700 border border-green-200'
              }`}
            >
              {isOpen ? 'Open' : 'Resolved'}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-900">{blocker.title}</p>
          {blocker.description && (
            <p className="text-sm text-gray-600 mt-1">{blocker.description}</p>
          )}
          {blocker.reportedBy && (
            <p className="text-xs text-gray-400 mt-1">
              Reported by {blocker.reportedBy.name}
            </p>
          )}
        </div>
        {canEdit && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onToggle}
              disabled={isToggling}
              title={isOpen ? 'Mark as resolved' : 'Reopen'}
              className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${
                isOpen
                  ? 'text-green-600 hover:bg-green-100'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {isOpen ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              title="Delete blocker"
              className="p-1.5 rounded-md text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
