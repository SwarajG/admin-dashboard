import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, CheckCircle2, AlertTriangle, Clock, TrendingUp } from 'lucide-react'
import type { DashboardStats } from '@repo/types'
import api from '../services/api'
import { ProjectCard } from '../components/ProjectCard'
import { DeadlineIndicator } from '../components/DeadlineIndicator'
import { StatusBadge } from '../components/StatusBadge'

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 w-28 bg-gray-200 rounded mb-2" />
          <div className="h-8 w-16 bg-gray-200 rounded" />
        </div>
        <div className="w-12 h-12 rounded-lg bg-gray-200" />
      </div>
    </div>
  )
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api
      .get('/projects/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your projects and activity</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Total Projects"
              value={stats?.totalProjects ?? 0}
              icon={FolderKanban}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              label="Active Projects"
              value={stats?.activeProjects ?? 0}
              icon={TrendingUp}
              color="bg-green-50 text-green-600"
            />
            <StatCard
              label="Open Blockers"
              value={stats?.openBlockers ?? 0}
              icon={AlertTriangle}
              color="bg-orange-50 text-orange-600"
            />
            <StatCard
              label="Upcoming Deadlines"
              value={stats?.upcomingDeadlines?.length ?? 0}
              icon={Clock}
              color="bg-purple-50 text-purple-600"
            />
          </>
        )}
      </div>

      {/* Deadlines This Week */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-500" />
          Deadlines This Week
        </h2>
        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 w-48 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : stats?.upcomingDeadlines && stats.upcomingDeadlines.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {stats.upcomingDeadlines.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={project.status} />
                  <span className="text-sm font-medium text-gray-900">{project.name}</span>
                </div>
                <DeadlineIndicator
                  deadline={project.deadline}
                  daysUntilDeadline={project.daysUntilDeadline}
                  status={project.status}
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No upcoming deadlines this week</p>
          </div>
        )}
      </section>

      {/* My Projects */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-500" />
            My Projects
          </h2>
          <Link
            to="/projects"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse h-40"
              >
                <div className="h-4 w-2/3 bg-gray-200 rounded mb-3" />
                <div className="h-3 w-full bg-gray-200 rounded mb-2" />
                <div className="h-3 w-4/5 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : stats?.myProjects && stats.myProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.myProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400 bg-white rounded-lg border border-gray-200">
            <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">You are not assigned to any projects yet</p>
          </div>
        )}
      </section>
    </div>
  )
}
