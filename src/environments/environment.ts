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
  keycloak_integration: window['env'].keycloak_integration,
  noteMaximumSize: window['env'].noteMaximumSize // in kilobytes
};
