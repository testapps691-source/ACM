import type { Consumer } from '../types/domain'

export const mockConsumers: Consumer[] = [
  // ── Kong consumers (production) ───────────────────────────────────────────
  { id: 'c-1',  username: 'svc-payments-processor',    environment: 'production',  system: 'kong' },
  { id: 'c-2',  username: 'svc-identity-gateway',      environment: 'production',  system: 'kong' },
  { id: 'c-3',  username: 'svc-analytics-collector',   environment: 'production',  system: 'kong' },
  { id: 'c-4',  username: 'svc-orders-api',            environment: 'production',  system: 'kong' },
  { id: 'c-5',  username: 'svc-reporting-engine',      environment: 'production',  system: 'kong' },
  { id: 'c-6',  username: 'app-mobile-backend',        environment: 'production',  system: 'kong' },
  { id: 'c-7',  username: 'app-web-frontend',          environment: 'production',  system: 'kong' },
  { id: 'c-8',  username: 'svc-notification-hub',      environment: 'production',  system: 'kong' },
  { id: 'c-9',  username: 'svc-audit-logger',          environment: 'production',  system: 'kong' },
  { id: 'c-10', username: 'svc-config-manager',        environment: 'production',  system: 'kong' },
  // ── Kong consumers (staging) ──────────────────────────────────────────────
  { id: 'c-11', username: 'svc-payments-processor-stg', environment: 'staging',   system: 'kong' },
  { id: 'c-12', username: 'svc-identity-gateway-stg',   environment: 'staging',   system: 'kong' },
  { id: 'c-13', username: 'svc-analytics-collector-stg',environment: 'staging',   system: 'kong' },
  { id: 'c-14', username: 'svc-orders-api-stg',         environment: 'staging',   system: 'kong' },
  { id: 'c-15', username: 'svc-reporting-engine-stg',   environment: 'staging',   system: 'kong' },
  { id: 'c-16', username: 'app-mobile-backend-stg',     environment: 'staging',   system: 'kong' },
  { id: 'c-17', username: 'app-web-frontend-stg',       environment: 'staging',   system: 'kong' },
  { id: 'c-18', username: 'svc-notification-hub-stg',   environment: 'staging',   system: 'kong' },
  { id: 'c-19', username: 'svc-audit-logger-stg',       environment: 'staging',   system: 'kong' },
  { id: 'c-20', username: 'svc-config-manager-stg',     environment: 'staging',   system: 'kong' },
  // ── Kong consumers (development) ─────────────────────────────────────────
  { id: 'c-21', username: 'svc-payments-dev',           environment: 'development', system: 'kong' },
  { id: 'c-22', username: 'svc-identity-dev',           environment: 'development', system: 'kong' },
  { id: 'c-23', username: 'svc-analytics-dev',          environment: 'development', system: 'kong' },
  { id: 'c-24', username: 'svc-orders-dev',             environment: 'development', system: 'kong' },
  { id: 'c-25', username: 'svc-reporting-dev',          environment: 'development', system: 'kong' },
  { id: 'c-26', username: 'app-mobile-dev',             environment: 'development', system: 'kong' },
  { id: 'c-27', username: 'app-web-dev',                environment: 'development', system: 'kong' },
  { id: 'c-28', username: 'svc-notification-dev',       environment: 'development', system: 'kong' },
  { id: 'c-29', username: 'svc-audit-dev',              environment: 'development', system: 'kong' },
  { id: 'c-30', username: 'svc-config-dev',             environment: 'development', system: 'kong' },
  // ── SAP BTP service accounts ──────────────────────────────────────────────
  { id: 'c-31', username: 'btp-svc-finance-integration', environment: 'production',  system: 'sap-btp' },
  { id: 'c-32', username: 'btp-svc-data-pipeline',       environment: 'production',  system: 'sap-btp' },
  { id: 'c-33', username: 'btp-svc-reporting',           environment: 'staging',     system: 'sap-btp' },
  // ── Azure AD service principals ───────────────────────────────────────────
  { id: 'c-34', username: 'sp-acmp-backend',             environment: 'production',  system: 'azure-ad' },
  { id: 'c-35', username: 'sp-monitoring-agent',         environment: 'production',  system: 'azure-ad' },
  { id: 'c-36', username: 'sp-ci-cd-runner',             environment: 'staging',     system: 'azure-ad' },
  // ── ADO service connections ───────────────────────────────────────────────
  { id: 'c-37', username: 'ado-svc-prod-deploy',         environment: 'production',  system: 'ado-pipelines' },
  { id: 'c-38', username: 'ado-svc-stg-deploy',          environment: 'staging',     system: 'ado-pipelines' },
  { id: 'c-39', username: 'ado-svc-test-runner',         environment: 'development', system: 'ado-pipelines' },
]
