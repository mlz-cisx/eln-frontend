import {EnvConfig} from "@joeseln/types";

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
  noteMaximumSize: window['env'].noteMaximumSize, // in kilobytes

  // --- HSDS normalization with stripping + empty-string safety ---

  hsds_url: (() => {
    const raw = (window['env'].hsds_url || '').trim();
    return raw ? raw.replace(/\/+$/, '') : '';
  })(),

  hsds_domain: (() => {
    const raw = (window['env'].hsds_domain || '').trim();
    if (!raw) return '';
    return (
      '/' +
      raw
        .replace(/^\/+/, '')   // strip leading slashes
        .replace(/\/+$/, '')   // strip trailing slashes
    );
  })(),

  hsds_username: (window['env'].hsds_username || '').trim(),
  hsds_password: (window['env'].hsds_password || '').trim(),
};
