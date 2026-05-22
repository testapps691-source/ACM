import { useState, type FormEvent } from 'react'
import type { KongConfig, AuthMethod, EndpointMapping } from '../../types/domain'
import { Spinner } from '../ui/Spinner'

interface KongConfigFormProps {
  initialValues?: Partial<KongConfig>
  onSave: (config: Omit<KongConfig, 'id' | 'savedAt' | 'savedBy'>) => void
}

const defaultMappings: EndpointMapping[] = [
  { resource: 'consumers', path: '/consumers' },
  { resource: 'acls', path: '/acls' },
  { resource: 'plugins', path: '/plugins' },
]

type TestResult = 'idle' | 'testing' | 'success' | 'failure'

export function KongConfigForm({ initialValues, onSave }: KongConfigFormProps) {
  const [baseUrl, setBaseUrl] = useState(initialValues?.baseUrl ?? '')
  const [authMethod, setAuthMethod] = useState<AuthMethod>(initialValues?.authMethod ?? 'api-key')
  const [credential, setCredential] = useState('')
  const [tlsEnabled, setTlsEnabled] = useState(initialValues?.tlsEnabled ?? true)
  const [mappings, setMappings] = useState<EndpointMapping[]>(
    initialValues?.endpointMappings ?? defaultMappings
  )
  const [testResult, setTestResult] = useState<TestResult>('idle')
  const [testError, setTestError] = useState('')

  function handleTestConnection() {
    if (!baseUrl || !credential) return
    setTestResult('testing')
    setTestError('')
    setTimeout(() => {
      if (baseUrl.startsWith('https://')) {
        setTestResult('success')
      } else {
        setTestResult('failure')
        setTestError('Connection failed: URL must use HTTPS. Verify the base URL and try again.')
      }
    }, 1000)
  }

  function handleMappingChange(resource: EndpointMapping['resource'], path: string) {
    setMappings(prev => prev.map(m => m.resource === resource ? { ...m, path } : m))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (testResult !== 'success') return
    onSave({ baseUrl, authMethod, credential, tlsEnabled, endpointMappings: mappings })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Base URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kong Admin API Base URL <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          required
          value={baseUrl}
          onChange={e => { setBaseUrl(e.target.value); setTestResult('idle') }}
          placeholder="https://kong-admin.example.com:8001"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          data-testid="base-url-input"
        />
      </div>

      {/* Auth method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Authentication Method <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-4">
          {(['api-key', 'bearer-token'] as AuthMethod[]).map(m => (
            <label key={m} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="authMethod"
                value={m}
                checked={authMethod === m}
                onChange={() => { setAuthMethod(m); setTestResult('idle') }}
                className="text-indigo-600"
                data-testid={`auth-method-${m}`}
              />
              <span className="text-sm text-gray-700 capitalize">{m.replace('-', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Credential */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {authMethod === 'api-key' ? 'API Key' : 'Bearer Token'} <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          required
          value={credential}
          onChange={e => { setCredential(e.target.value); setTestResult('idle') }}
          placeholder={authMethod === 'api-key' ? 'Enter API key...' : 'Enter bearer token...'}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          data-testid="credential-input"
        />
      </div>

      {/* TLS toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="tls-toggle"
          checked={tlsEnabled}
          onChange={e => setTlsEnabled(e.target.checked)}
          className="w-4 h-4 text-indigo-600 rounded"
          data-testid="tls-toggle"
        />
        <label htmlFor="tls-toggle" className="text-sm text-gray-700">
          Enable TLS verification
        </label>
      </div>

      {/* Endpoint mappings */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">Endpoint Mappings</div>
        <div className="space-y-2">
          {mappings.map(m => (
            <div key={m.resource} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-20 capitalize">{m.resource}</span>
              <input
                type="text"
                value={m.path}
                onChange={e => handleMappingChange(m.resource, e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                data-testid={`endpoint-mapping-${m.resource}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Test connection */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={!baseUrl || !credential || testResult === 'testing'}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          data-testid="test-connection-button"
        >
          {testResult === 'testing' && <Spinner size="sm" />}
          Test Connection
        </button>

        {testResult === 'success' && (
          <span className="text-sm text-green-600 font-medium" data-testid="test-success">
            ✓ Connection successful
          </span>
        )}
        {testResult === 'failure' && (
          <span className="text-sm text-red-600" data-testid="test-failure">
            ✗ {testError}
          </span>
        )}
      </div>

      {/* Save */}
      <button
        type="submit"
        disabled={testResult !== 'success'}
        className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        data-testid="save-button"
      >
        Save Configuration
      </button>
    </form>
  )
}
