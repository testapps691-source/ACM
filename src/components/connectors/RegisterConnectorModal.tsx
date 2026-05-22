import { useState } from 'react'
import type { ConnectorRegistryEntry, ConnectorType } from '../../types/domain'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3

interface FormState {
  // Step 1 — Identity
  name: string
  system: string
  connectorType: ConnectorType
  version: string
  ownerTeam: string
  slaTier: 'P1' | 'P2' | 'P3'
  // Step 2 — Connection
  baseUrl: string
  authType: string
  apiKey: string
  clientId: string
  clientSecret: string
  bearerToken: string
}

const BLANK: FormState = {
  name: '',
  system: '',
  connectorType: 'custom',
  version: '1.0.0',
  ownerTeam: '',
  slaTier: 'P2',
  baseUrl: '',
  authType: 'API Key',
  apiKey: '',
  clientId: '',
  clientSecret: '',
  bearerToken: '',
}

const AUTH_TYPES = [
  'API Key',
  'Bearer Token',
  'OAuth2 Client Credentials',
  'Basic Auth',
  'mTLS',
]

const SYSTEM_PRESETS: { label: string; value: string; urlHint: string }[] = [
  { label: 'Kong API Gateway', value: 'kong', urlHint: 'https://kong-admin.example.com:8001' },
  { label: 'Azure AD (Entra ID)', value: 'azure-ad', urlHint: 'https://graph.microsoft.com/v1.0' },
  { label: 'SAP BTP', value: 'sap-btp', urlHint: 'https://api.cf.eu10.hana.ondemand.com' },
  { label: 'Azure DevOps', value: 'ado-pipelines', urlHint: 'https://dev.azure.com/your-org' },
  { label: 'Custom / Other', value: 'custom', urlHint: 'https://api.example.com' },
]

const SYSTEM_COLORS: Record<string, string> = {
  'kong':          '#f59e0b',
  'azure-ad':      '#0078d4',
  'sap-btp':       '#0070f2',
  'ado-pipelines': '#68217a',
  'custom':        '#6366f1',
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateStep1(f: FormState): string[] {
  const errs: string[] = []
  if (!f.name.trim()) errs.push('Connector name is required.')
  if (!f.system) errs.push('System type is required.')
  if (!f.ownerTeam.trim()) errs.push('Owner team is required.')
  if (!f.version.trim()) errs.push('Version is required.')
  return errs
}

function validateStep2(f: FormState): string[] {
  const errs: string[] = []
  if (!f.baseUrl.trim()) {
    errs.push('Base URL is required.')
  } else {
    try { new URL(f.baseUrl) } catch { errs.push('Base URL must be a valid URL (e.g. https://api.example.com).') }
  }
  if (f.authType === 'API Key' && !f.apiKey.trim()) errs.push('API Key is required.')
  if (f.authType === 'Bearer Token' && !f.bearerToken.trim()) errs.push('Bearer token is required.')
  if (f.authType === 'OAuth2 Client Credentials') {
    if (!f.clientId.trim()) errs.push('Client ID is required.')
    if (!f.clientSecret.trim()) errs.push('Client Secret is required.')
  }
  return errs
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1 as Step, label: 'Identity' },
    { n: 2 as Step, label: 'Connection' },
    { n: 3 as Step, label: 'Review' },
  ]
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
              current === s.n
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : current > s.n
                ? 'bg-indigo-100 border-indigo-400 text-indigo-600'
                : 'bg-white border-gray-300 text-gray-400'
            }`}>
              {current > s.n ? '✓' : s.n}
            </div>
            <span className={`text-xs mt-1 font-medium ${current === s.n ? 'text-indigo-600' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 flex-1 mx-1 mb-4 rounded ${current > s.n ? 'bg-indigo-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function FieldError({ errors, field }: { errors: string[]; field: string }) {
  const match = errors.find(e => e.toLowerCase().includes(field.toLowerCase()))
  if (!match) return null
  return <p className="text-xs text-red-600 mt-1">{match}</p>
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-gray-700 mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Input({ value, onChange, placeholder, type = 'text', className = '' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${className}`}
    />
  )
}

// ─── Step 1: Identity ─────────────────────────────────────────────────────────

function Step1({ form, setForm, errors }: {
  form: FormState
  setForm: (f: FormState) => void
  errors: string[]
}) {
  const set = (k: keyof FormState) => (v: string) => setForm({ ...form, [k]: v })

  return (
    <div className="space-y-4">
      <div>
        <Label required>Connector Name</Label>
        <Input value={form.name} onChange={set('name')} placeholder="e.g. Okta Identity Provider" />
        <FieldError errors={errors} field="name" />
      </div>

      <div>
        <Label required>System Type</Label>
        <div className="grid grid-cols-1 gap-2">
          {SYSTEM_PRESETS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => setForm({
                ...form,
                system: p.value,
                baseUrl: form.baseUrl || p.urlHint,
                connectorType: p.value === 'custom' ? 'custom' : 'built-in',
              })}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${
                form.system === p.value
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: SYSTEM_COLORS[p.value] ?? '#6366f1' }}
              >
                {p.label[0]}
              </div>
              <span className="font-medium">{p.label}</span>
              {form.system === p.value && (
                <span className="ml-auto text-indigo-500">✓</span>
              )}
            </button>
          ))}
        </div>
        <FieldError errors={errors} field="system" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label required>Version</Label>
          <Input value={form.version} onChange={set('version')} placeholder="1.0.0" />
          <FieldError errors={errors} field="version" />
        </div>
        <div>
          <Label required>SLA Tier</Label>
          <select
            value={form.slaTier}
            onChange={e => set('slaTier')(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="P1">P1 — Critical</option>
            <option value="P2">P2 — High</option>
            <option value="P3">P3 — Standard</option>
          </select>
        </div>
      </div>

      <div>
        <Label required>Owner Team</Label>
        <Input value={form.ownerTeam} onChange={set('ownerTeam')} placeholder="e.g. Platform Engineering" />
        <FieldError errors={errors} field="owner" />
      </div>

      <div>
        <Label>Connector Type</Label>
        <div className="flex gap-2">
          {(['built-in', 'certified', 'custom'] as ConnectorType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => set('connectorType')(t)}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                form.connectorType === t
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Connection ───────────────────────────────────────────────────────

function Step2({ form, setForm, errors, testState, onTest }: {
  form: FormState
  setForm: (f: FormState) => void
  errors: string[]
  testState: TestState
  onTest: () => void
}) {
  const set = (k: keyof FormState) => (v: string) => setForm({ ...form, [k]: v })

  return (
    <div className="space-y-4">
      <div>
        <Label required>Base URL</Label>
        <Input value={form.baseUrl} onChange={set('baseUrl')} placeholder="https://api.example.com" />
        <FieldError errors={errors} field="url" />
      </div>

      <div>
        <Label required>Authentication Type</Label>
        <select
          value={form.authType}
          onChange={e => set('authType')(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {AUTH_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {form.authType === 'API Key' && (
        <div>
          <Label required>API Key</Label>
          <Input type="password" value={form.apiKey} onChange={set('apiKey')} placeholder="••••••••••••••••" />
          <FieldError errors={errors} field="api key" />
        </div>
      )}

      {form.authType === 'Bearer Token' && (
        <div>
          <Label required>Bearer Token</Label>
          <Input type="password" value={form.bearerToken} onChange={set('bearerToken')} placeholder="••••••••••••••••" />
          <FieldError errors={errors} field="bearer" />
        </div>
      )}

      {form.authType === 'OAuth2 Client Credentials' && (
        <>
          <div>
            <Label required>Client ID</Label>
            <Input value={form.clientId} onChange={set('clientId')} placeholder="your-client-id" />
            <FieldError errors={errors} field="client id" />
          </div>
          <div>
            <Label required>Client Secret</Label>
            <Input type="password" value={form.clientSecret} onChange={set('clientSecret')} placeholder="••••••••••••••••" />
            <FieldError errors={errors} field="client secret" />
          </div>
        </>
      )}

      {form.authType === 'Basic Auth' && (
        <>
          <div>
            <Label required>Username</Label>
            <Input value={form.clientId} onChange={set('clientId')} placeholder="admin" />
          </div>
          <div>
            <Label required>Password</Label>
            <Input type="password" value={form.clientSecret} onChange={set('clientSecret')} placeholder="••••••••••••••••" />
          </div>
        </>
      )}

      {/* Connection test */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onTest}
          disabled={testState.status === 'testing'}
          className="w-full py-2 border border-indigo-300 text-indigo-700 text-sm rounded-lg hover:bg-indigo-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {testState.status === 'testing' ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Testing connection…
            </>
          ) : '⚡ Test Connection'}
        </button>

        {testState.status === 'success' && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <div>
              <div className="font-medium">Connection successful</div>
              <div className="text-green-600 mt-0.5">{testState.message}</div>
            </div>
          </div>
        )}

        {testState.status === 'error' && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <span className="text-red-500 mt-0.5">✗</span>
            <div>
              <div className="font-medium">Connection failed</div>
              <div className="text-red-600 mt-0.5">{testState.message}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────

function Step3({ form, testState }: { form: FormState; testState: TestState }) {
  const systemLabel = SYSTEM_PRESETS.find(p => p.value === form.system)?.label ?? form.system
  const systemColor = SYSTEM_COLORS[form.system] ?? '#6366f1'

  const rows: { label: string; value: string }[] = [
    { label: 'Name', value: form.name },
    { label: 'System', value: systemLabel },
    { label: 'Type', value: form.connectorType },
    { label: 'Version', value: form.version },
    { label: 'SLA Tier', value: form.slaTier },
    { label: 'Owner Team', value: form.ownerTeam },
    { label: 'Base URL', value: form.baseUrl },
    { label: 'Auth Type', value: form.authType },
  ]

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
          style={{ background: systemColor }}
        >
          {form.name[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <div className="font-semibold text-gray-900">{form.name}</div>
          <div className="text-xs text-gray-500">{systemLabel} · {form.connectorType} · v{form.version}</div>
        </div>
      </div>

      {/* Details table */}
      <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
        {rows.map(r => (
          <div key={r.label} className="flex justify-between px-4 py-2.5 text-sm">
            <span className="text-gray-400 text-xs">{r.label}</span>
            <span className="font-medium text-gray-800 text-xs font-mono truncate max-w-[220px]">{r.value}</span>
          </div>
        ))}
      </div>

      {/* Test status */}
      {testState.status === 'success' && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
          <span>✓</span>
          <span>Connection test passed — connector is reachable</span>
        </div>
      )}
      {testState.status === 'idle' && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
          <span>⚠</span>
          <span>Connection not tested. You can still register and test later.</span>
        </div>
      )}
      {testState.status === 'error' && (
        <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
          <span>⚠</span>
          <span>Connection test failed. Registering anyway — verify credentials after setup.</span>
        </div>
      )}

      <p className="text-xs text-gray-400">
        The connector will be registered with <span className="font-medium text-gray-600">pending</span> status.
        An initial sync will be triggered automatically within 5 minutes.
      </p>
    </div>
  )
}

// ─── Test state ───────────────────────────────────────────────────────────────

interface TestState {
  status: 'idle' | 'testing' | 'success' | 'error'
  message: string
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface RegisterConnectorModalProps {
  open: boolean
  onClose: () => void
  onRegister: (entry: ConnectorRegistryEntry) => void
}

export function RegisterConnectorModal({ open, onClose, onRegister }: RegisterConnectorModalProps) {
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormState>(BLANK)
  const [errors, setErrors] = useState<string[]>([])
  const [testState, setTestState] = useState<TestState>({ status: 'idle', message: '' })

  if (!open) return null

  function handleClose() {
    setStep(1)
    setForm(BLANK)
    setErrors([])
    setTestState({ status: 'idle', message: '' })
    onClose()
  }

  function handleNext() {
    const errs = step === 1 ? validateStep1(form) : validateStep2(form)
    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])
    setStep(s => (s + 1) as Step)
  }

  function handleBack() {
    setErrors([])
    setStep(s => (s - 1) as Step)
  }

  function handleTest() {
    const errs = validateStep2(form)
    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])
    setTestState({ status: 'testing', message: '' })
    // Simulate async connection test
    setTimeout(() => {
      // Simulate success for well-known systems, random for custom
      const knownSystems = ['kong', 'azure-ad', 'sap-btp', 'ado-pipelines']
      const success = knownSystems.includes(form.system) ? Math.random() > 0.2 : Math.random() > 0.4
      if (success) {
        setTestState({
          status: 'success',
          message: `Responded in ${Math.floor(80 + Math.random() * 200)}ms · API version detected`,
        })
      } else {
        setTestState({
          status: 'error',
          message: 'Connection refused or authentication failed. Check the URL and credentials.',
        })
      }
    }, 1800)
  }

  function handleRegister() {
    const now = new Date().toISOString()
    const entry: ConnectorRegistryEntry = {
      id: `conn-${form.system}-${Date.now()}`,
      name: form.name,
      system: form.system as ConnectorRegistryEntry['system'],
      connectorType: form.connectorType,
      version: form.version,
      baseUrl: form.baseUrl,
      authType: form.authType,
      status: testState.status === 'success' ? 'healthy' : 'degraded',
      lastSyncAt: now,
      lastSyncDurationMs: 0,
      entityCount: 0,
      roleCount: 0,
      ownerTeam: form.ownerTeam,
      slaTier: form.slaTier,
      pendingSyncItems: 0,
      errorRate: 0,
      p95LatencyMs: 0,
      errorMessage: testState.status === 'error'
        ? 'Initial sync pending — connection test failed. Verify credentials.'
        : undefined,
    }
    onRegister(entry)
    handleClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} aria-hidden="true" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 z-10 flex flex-col"
        style={{ maxHeight: '90vh' }}
        role="dialog"
        aria-modal="true"
        aria-label="Register Connector"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Register Connector</h2>
            <p className="text-xs text-gray-400 mt-0.5">Connect a new system to ACMP governance</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <StepIndicator current={step} />

          {step === 1 && <Step1 form={form} setForm={setForm} errors={errors} />}
          {step === 2 && (
            <Step2
              form={form}
              setForm={setForm}
              errors={errors}
              testState={testState}
              onTest={handleTest}
            />
          )}
          {step === 3 && <Step3 form={form} testState={testState} />}

          {/* Validation errors summary */}
          {errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <ul className="space-y-1">
                {errors.map((e, i) => (
                  <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                    <span className="mt-0.5 flex-shrink-0">•</span>{e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            type="button"
            onClick={step === 1 ? handleClose : handleBack}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRegister}
              className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Register Connector
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
