import { EnvConfig } from "@joeseln/types";

declare global {
  interface Window {
    env: EnvConfig;
  }
}
export const environment = {
  production: false,
  apiUrl: window['env'].apiUrl.replace(/\/+$/, ''),
  wsUrl: window['env'].wsUrl.replace(/\/+$/, ''),
  labBookSocketRefreshInterval: window['env'].labBookSocketRefreshInterval,
  keycloak_integration: window['env'].keycloak_integration,
  instr_csv_all: window['env'].instr_csv_all,
  noteMaximumSize: window['env'].noteMaximumSize // in kilobytes
};
