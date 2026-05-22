import { useState } from 'react'
import { Link } from 'react-router-dom'
import { mockCurrentUser } from '../mock/mockConfig'
import { useKongConfig } from '../utils/kongConfigContext'

type TestState = 'idle' | 'testing' | 'success' | 'error'

export function AppConfigPage() {
  const { config, saveConfig, clearConfig, testConfig } = useKongConfig()

  const [baseUrl, setBaseUrl] = useState(config.baseUrl)
  const [apiKey, setApiKey] = useState(config.apiKey)
  const [testState, setTestState] = useState<TestState>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [testVersion, setTestVersion] = useState('')
  const [savedBanner, setSavedBanner] = useState(false)

  // Access guard
  if (mockCurrentUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-4">
          You need the <strong>platform-administrator</strong> role to access this page.
        </p>
        <Link to="/dashboard" className="text-indigo-600 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  async function handleTest() {
    if (!baseUrl.trim()) return
    setTestState('testing')
    setTestMessage('')
    const result = await testConfig(baseUrl.trim(), apiKey.trim())
    setTestState(result.ok ? 'success' : 'error')
    setTestMessage(result.message)
    setTestVersion(result.version ?? '')
  }

  function handleSave() {
    saveConfig(baseUrl.trim(), apiKey.trim())
    setSavedBanner(true)
    setTimeout(() => setSavedBanner(false), 3000)
  }

  function handleClear() {
    clearConfig()
    setBaseUrl('')
    setApiKey('')
    setTestState('idle')
    setTestMessage('')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">App Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect ACMP to your Kong Admin API for real-time data
        </p>
      </div>

      {/* Saved banner */}
      {savedBanner && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 font-medium flex items-center gap-2">
          <span>✓</span> Kong configuration saved — live data is now active across the app.
        </div>
      )}

      {/* Current status */}
      <div className={`rounded-xl border p-4 flex items-center justify-between ${
        config.enabled
          ? 'bg-green-50 border-green-200'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
            config.enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
          }`} />
          <div>
            <div className={`text-sm font-semibold ${config.enabled ? 'text-green-800' : 'text-gray-600'}`}>
              {config.enabled ? 'Kong API Connected' : 'Using Mock Data'}
            </div>
            {config.enabled && (
              <div className="text-xs text-green-700 mt-0.5 font-mono">{config.baseUrl}</div>
            )}
            {!config.enabled && (
              <div className="text-xs text-gray-400 mt-0.5">
                Enter your Kong Admin API URL below to enable live data
              </div>
            )}
          </div>
        </div>
        {config.enabled && (
          <button
            onClick={handleClear}
            className="text-xs text-red-600 hover:text-red-800 font-medium border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            Disconnect
          </button>
        )}
      </div>

      {/* Config form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span>⚡</span> Kong Admin API Settings
        </h2>

        {/* Base URL */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Admin API URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={baseUrl}
            onChange={e => setBaseUrl(e.target.value)}
            placeholder="http://localhost:8001"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            The Kong Admin API base URL. For Docker: <code className="bg-gray-100 px-1 rounded">http://host.docker.internal:8001</code>
          </p>
        </div>

        {/* API Key / Token */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            API Key / Bearer Token
            <span className="ml-1 text-gray-400 font-normal">(leave blank if Admin API is unsecured)</span>
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="••••••••••••••••"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Sent as the <code className="bg-gray-100 px-1 rounded">apikey</code> header on every request.
          </p>
        </div>

        {/* Test result */}
        {testState === 'success' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 text-sm">
            <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
            <div>
              <div className="font-medium text-green-800">{testMessage}</div>
              {testVersion && (
                <div className="text-xs text-green-600 mt-0.5">Ready to save and activate live data.</div>
              )}
            </div>
          </div>
        )}
        {testState === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm">
            <span className="text-red-500 mt-0.5 flex-shrink-0">✗</span>
            <div>
              <div className="font-medium text-red-800">Connection failed</div>
              <div className="text-xs text-red-600 mt-0.5">{testMessage}</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleTest}
            disabled={!baseUrl.trim() || testState === 'testing'}
            className="px-4 py-2 border border-indigo-300 text-indigo-700 text-sm rounded-lg hover:bg-indigo-50 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {testState === 'testing' ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Testing…
              </>
            ) : '⚡ Test Connection'}
          </button>

          <button
            onClick={handleSave}
            disabled={!baseUrl.trim()}
            className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save & Activate
          </button>
        </div>
      </div>

      {/* What goes live */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">What becomes live when connected</h2>
        <div className="space-y-3">
          {[
            { page: 'Connector Registry', detail: 'Real Kong version, health, consumer count, ACL group count', live: true },
            { page: 'Role Explorer', detail: 'Real ACL groups from Kong shown as roles', live: true },
            { page: 'Dashboard — Kong tab', detail: 'Live connector health card + real role assignments', live: true },
            { page: 'Azure AD, SAP BTP, ADO tabs', detail: 'Remain on mock data', live: false },
            { page: 'Approval Queue, JIT, Audit Log', detail: 'Remain on mock data (need ACMP backend)', live: false },
          ].map(row => (
            <div key={row.page} className="flex items-start gap-3 text-sm">
              <span className={`mt-0.5 flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${
                row.live ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {row.live ? 'LIVE' : 'MOCK'}
              </span>
              <div>
                <div className="font-medium text-gray-800">{row.page}</div>
                <div className="text-xs text-gray-400">{row.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CORS note */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
        <div className="font-semibold">⚠ CORS note for local development</div>
        <div>
          If Kong Admin API is on a different host/port, the browser will block direct calls.
          Use the Vite dev proxy (<code className="bg-amber-100 px-1 rounded">npm run dev</code>) or
          the Nginx <code className="bg-amber-100 px-1 rounded">/kong-api/</code> proxy block —
          both forward requests server-side to avoid CORS.
          Set the URL to <code className="bg-amber-100 px-1 rounded">/kong-api</code> when using either proxy.
        </div>
      </div>
    </div>
  )
}
