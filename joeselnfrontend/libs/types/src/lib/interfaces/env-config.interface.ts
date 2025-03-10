export interface EnvConfig {
  apiUrl: string;
  wsUrl: string;
  labBookSocketRefreshInterval: number;
  keycloak_url: string;
  keycloak_realm: string;
  keycloak_clientId: string;
  keycloak_integration: boolean;
  noteMaximumSize: number;
}
