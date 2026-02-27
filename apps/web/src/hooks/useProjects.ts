import { useState, useEffect, useCallback } from 'react'
import type { ProjectSummary, ProjectDetail } from '@repo/types'
import api from '../services/api'

export function useProjects() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.get('/projects')
      setProjects(res.data.projects)
      setError(null)
    } catch {
      setError('Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return { projects, isLoading, error, refetch: fetchProjects }
}

export function useProject(id: string) {
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const res = await api.get(`/projects/${id}`)
      setProject(res.data.project)
      setError(null)
    } catch {
      setError('Failed to load project')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  return { project, isLoading, error, refetch: fetchProject }
}
