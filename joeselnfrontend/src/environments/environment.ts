import {EnvConfig} from "@joeseln/types";

declare global {
  interface Window {
    env: EnvConfig;
  }
}

export const environment = {
  production: false,
  apiUrl: window['env'].apiUrl,
  wsUrl: window['env'].wsUrl,
  labBookSocketRefreshInterval: window['env'].labBookSocketRefreshInterval,
  keycloak_url: window['env'].keycloak_url,
  keycloak_realm: window['env'].keycloak_realm,
  keycloak_clientId: window['env'].keycloak_clientId,
  keycloak_integration: window['env'].keycloak_integration,
  noteMaximumSize: window['env'].noteMaximumSize // in kilobytes
};
