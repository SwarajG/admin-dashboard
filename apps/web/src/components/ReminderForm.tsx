import { useState } from 'react'
import { PlusCircle, Trash2, Bell, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { ReminderDto } from '@repo/types'
import api from '../services/api'

interface ReminderFormProps {
  projectId: string
  reminders: ReminderDto[]
  canEdit: boolean
  onRefresh: () => void
}

export function ReminderForm({ projectId, reminders, canEdit, onRefresh }: ReminderFormProps) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [remindAt, setRemindAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!remindAt) {
      toast.error('Reminder date/time is required')
      return
    }
    setSubmitting(true)
    try {
      const remindAtISO = new Date(remindAt).toISOString()
      await api.post(`/projects/${projectId}/reminders`, {
        title: title.trim(),
        message: message.trim() || undefined,
        remindAt: remindAtISO,
      })
      toast.success('Reminder created')
      setTitle('')
      setMessage('')
      setRemindAt('')
      setShowForm(false)
      onRefresh()
    } catch {
      // error handled globally
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (reminderId: string) => {
    if (!confirm('Delete this reminder?')) return
    setDeletingId(reminderId)
    try {
      await api.delete(`/projects/${projectId}/reminders/${reminderId}`)
      toast.success('Reminder deleted')
      onRefresh()
    } catch {
      // error handled globally
    } finally {
      setDeletingId(null)
    }
  }

  const upcomingReminders = reminders.filter((r) => !r.isSent)
  const sentReminders = reminders.filter((r) => r.isSent)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Reminders</h3>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <PlusCircle className="w-4 h-4" />
            Add Reminder
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Reminder title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Optional message..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remind At <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={remindAt}
              onChange={(e) => setRemindAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={submitting}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Reminder'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setTitle('')
                setMessage('')
                setRemindAt('')
              }}
              className="px-4 py-2 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {reminders.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No reminders set</p>
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingReminders.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                Upcoming
              </p>
              <div className="space-y-2">
                {upcomingReminders.map((reminder) => (
                  <ReminderItem
                    key={reminder.id}
                    reminder={reminder}
                    canEdit={canEdit}
                    isDeleting={deletingId === reminder.id}
                    onDelete={() => handleDelete(reminder.id)}
                  />
                ))}
              </div>
            </div>
          )}
          {sentReminders.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Sent
              </p>
              <div className="space-y-2">
                {sentReminders.map((reminder) => (
                  <ReminderItem
                    key={reminder.id}
                    reminder={reminder}
                    canEdit={canEdit}
                    isDeleting={deletingId === reminder.id}
                    onDelete={() => handleDelete(reminder.id)}
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

interface ReminderItemProps {
  reminder: ReminderDto
  canEdit: boolean
  isDeleting: boolean
  onDelete: () => void
}

function ReminderItem({ reminder, canEdit, isDeleting, onDelete }: ReminderItemProps) {
  const formattedDate = format(new Date(reminder.remindAt), 'MMM d, yyyy h:mm a')

  return (
    <div
      className={`rounded-lg border p-4 ${
        reminder.isSent
          ? 'bg-gray-50 border-gray-200 opacity-70'
          : 'bg-blue-50 border-blue-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {reminder.isSent && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                Sent
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-900">{reminder.title}</p>
          {reminder.message && (
            <p className="text-sm text-gray-600 mt-1">{reminder.message}</p>
          )}
          <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            {formattedDate}
          </div>
          {reminder.createdBy && (
            <p className="text-xs text-gray-400 mt-1">by {reminder.createdBy.name}</p>
          )}
        </div>
        {canEdit && (
          <button
            onClick={onDelete}
            disabled={isDeleting}
            title="Delete reminder"
            className="p-1.5 rounded-md text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
