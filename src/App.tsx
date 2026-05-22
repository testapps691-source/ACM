import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Component, type ReactNode } from 'react'
import { PersonaProvider } from './utils/personaContext'
import { KongConfigProvider } from './utils/kongConfigContext'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { ApprovalQueuePage } from './pages/ApprovalQueuePage'
import { RoleExplorerPage } from './pages/RoleExplorerPage'
import { AppConfigPage } from './pages/AppConfigPage'
import { AuditLogPage } from './pages/AuditLogPage'
import { AccessGraphPage } from './pages/AccessGraphPage'
import { RoleLifecyclePage } from './pages/RoleLifecyclePage'
import { UserAccessProfilePage } from './pages/UserAccessProfilePage'
import { AccessHeatmapPage } from './pages/AccessHeatmapPage'
import { ConnectorRegistryPage } from './pages/ConnectorRegistryPage'
import { JitAccessPage } from './pages/JitAccessPage'
import { AccessReviewPage } from './pages/AccessReviewPage'
import { ComplianceReportsPage } from './pages/ComplianceReportsPage'
import { RiskScorePage } from './pages/RiskScorePage'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <div className="bg-white rounded-xl shadow p-8 max-w-lg text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 mb-2">An unexpected error occurred. Please refresh the page.</p>
            {this.state.error && (
              <pre className="text-xs text-left bg-gray-50 p-3 rounded-lg text-red-600 mb-4 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <KongConfigProvider>
        <PersonaProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"  element={<DashboardPage />} />
              <Route path="approvals"  element={<ApprovalQueuePage />} />
              <Route path="approvals/:requestId" element={<ApprovalQueuePage />} />
              <Route path="jit"        element={<JitAccessPage />} />
              <Route path="review"     element={<AccessReviewPage />} />
              <Route path="roles"      element={<RoleExplorerPage />} />
              <Route path="lifecycle"  element={<RoleLifecyclePage />} />
              <Route path="users/:userId" element={<UserAccessProfilePage />} />
              <Route path="users"      element={<UserAccessProfilePage />} />
              <Route path="heatmap"    element={<AccessHeatmapPage />} />
              <Route path="risk"       element={<RiskScorePage />} />
              <Route path="graph"      element={<AccessGraphPage />} />
              <Route path="reports"    element={<ComplianceReportsPage />} />
              <Route path="connectors" element={<ConnectorRegistryPage />} />
              <Route path="config"     element={<AppConfigPage />} />
              <Route path="audit"      element={<AuditLogPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </PersonaProvider>
      </KongConfigProvider>
    </ErrorBoundary>
  )
}
