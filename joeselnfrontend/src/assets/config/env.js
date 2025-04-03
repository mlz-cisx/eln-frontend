(function(window) {
  window.env = window.env || {};
  window['env'].apiUrl = 'http://172.25.74.236:8010/api';
  window['env'].wsUrl = 'ws://172.25.74.236:4501/ws';
  window['env'].labBookSocketRefreshInterval = 1000;
  window['env'].keycloak_url = 'http://daphneopc01:8082/';
  window['env'].keycloak_realm = 'joe';
  window['env'].keycloak_clientId = 'my_client';
  window['env'].keycloak_integration = true;
  window['env'].noteMaximumSize = 5000; // in kilobytes
})(this);
