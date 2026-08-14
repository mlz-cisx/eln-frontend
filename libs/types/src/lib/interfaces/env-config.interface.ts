export interface EnvConfig {
  apiUrl: string;
  labBookSocketRefreshInterval: number;
  keycloak_url: string;
  keycloak_realm: string;
  keycloak_clientId: string;
  keycloak_integration: boolean;
  instr_csv_all: boolean;
  noteMaximumSize: number;
  hsds_url: string;
  hsds_username: string;
  hsds_password: string;
  hsds_domain: string;
}
