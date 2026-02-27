import { Routes, Route, Navigate } from 'react-router-dom'
import { PrivateRoute } from './PrivateRoute'
import { Login } from '../pages/Login'
import { Register } from '../pages/Register'
import { Dashboard } from '../pages/Dashboard'
import { ProjectList } from '../pages/ProjectList'
import { ProjectDetail } from '../pages/ProjectDetail'
import { ProjectForm } from '../pages/ProjectForm'
import { AdminUsers } from '../pages/AdminUsers'
import { AuthCallback } from '../pages/AuthCallback'
import { Layout } from '../components/Layout'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route
          path="/projects/new"
          element={
            <PrivateRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <ProjectForm />
            </PrivateRoute>
          }
        />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route
          path="/projects/:id/edit"
          element={
            <PrivateRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <ProjectForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <AdminUsers />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  )
}
