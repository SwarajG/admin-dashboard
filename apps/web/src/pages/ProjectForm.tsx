import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { createProjectSchema, updateProjectSchema } from '@repo/validators'
import type { CreateProjectInput, UpdateProjectInput } from '@repo/validators'
import api from '../services/api'

const STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DONE', label: 'Done' },
] as const

type CreateFormData = CreateProjectInput & { deadline?: string | null }
type EditFormData = UpdateProjectInput & { deadline?: string | null }

export function ProjectForm() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(isEditing)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFormData | EditFormData>({
    resolver: zodResolver(isEditing ? updateProjectSchema : createProjectSchema),
  })

  useEffect(() => {
    if (!isEditing || !id) return
    setIsFetching(true)
    api
      .get(`/projects/${id}`)
      .then((res) => {
        const project = res.data
        const deadlineValue = project.deadline
          ? new Date(project.deadline).toISOString().slice(0, 10)
          : ''
        reset({
          name: project.name,
          description: project.description ?? '',
          deadline: deadlineValue,
          status: project.status,
        })
      })
      .catch(() => {
        toast.error('Failed to load project')
        navigate('/projects')
      })
      .finally(() => setIsFetching(false))
  }, [id, isEditing, reset, navigate])

  const onSubmit = async (data: CreateFormData | EditFormData) => {
    setIsLoading(true)
    try {
      // Convert date string to ISO datetime if present
      const payload = {
        ...data,
        description: data.description || undefined,
        deadline: data.deadline
          ? new Date(data.deadline + 'T00:00:00').toISOString()
          : null,
      }

      if (isEditing && id) {
        await api.patch(`/projects/${id}`, payload)
        toast.success('Project updated')
        navigate(`/projects/${id}`)
      } else {
        const res = await api.post('/projects', payload)
        toast.success('Project created')
        navigate(`/projects/${res.data.id}`)
      }
    } catch {
      // error handled globally
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="p-6 max-w-2xl mx-auto animate-pulse">
        <div className="h-5 w-40 bg-gray-200 rounded mb-6" />
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link
        to={isEditing && id ? `/projects/${id}` : '/projects'}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {isEditing ? 'Back to project' : 'Back to projects'}
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">
          {isEditing ? 'Edit Project' : 'Create New Project'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="Enter project name"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              {...register('description')}
              placeholder="Describe the project goals and scope..."
              rows={4}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50 resize-none"
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deadline <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="date"
              {...register('deadline')}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
            />
            {errors.deadline && (
              <p className="text-xs text-red-500 mt-1">{errors.deadline.message}</p>
            )}
          </div>

          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                {...register('status')}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50 bg-white"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {'status' in errors && errors.status && (
                <p className="text-xs text-red-500 mt-1">{errors.status.message}</p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isLoading
                ? isEditing
                  ? 'Saving...'
                  : 'Creating...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Project'}
            </button>
            <Link
              to={isEditing && id ? `/projects/${id}` : '/projects'}
              className="px-5 py-2.5 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
