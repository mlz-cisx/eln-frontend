(function(window) {
  window.env = window.env || {};
  window["env"].apiUrl = "http://localhost:8010/api";
  window["env"].wsUrl = "ws://localhost:4501/ws";
  window['env'].labBookSocketRefreshInterval = 1000;
  window["env"].keycloak_url = "http://localhost:8082/";
  window['env'].keycloak_realm = 'joe';
  window['env'].keycloak_clientId = 'my_client';
  window['env'].keycloak_integration = true;
  window['env'].noteMaximumSize = 5000; // in kilobytes
})(this);
