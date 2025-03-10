export const environment = {
  production: true,
  apiUrl: 'http://172.25.74.236:8010/api',
  wsUrl: 'ws://172.25.74.236:4501/ws',
  tracking: false,
  matomoUrl: null,
  matomoId: null,
  labBookSocketRefreshInterval: 1000,
  eln_exporter: 'http://172.25.74.236:5000',
  keycloak_url: 'http://daphneopc01:8082/',
  keycloak_realm: 'joe',
  keycloak_clientId: 'my_client',
  keycloak_integration: true,
  noteMaximumSize: 5000 // in kilobytes
};
