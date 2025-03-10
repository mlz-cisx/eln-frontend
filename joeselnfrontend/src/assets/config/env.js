(function(window) {
  window.env = window.env || {};
  window['env'].apiUrl = 'http://wojians-macbook.local:8010/api';
  window['env'].wsUrl = 'http://wojians-macbook.local:8011/ws';
  window['env'].labBookSocketRefreshInterval = 1000;
  window['env'].keycloak_url = 'http://wojians-macbook.local:8080/';
  window['env'].keycloak_realm = 'joe';
  window['env'].keycloak_clientId = 'client_frontend';
  window['env'].keycloak_integration = true;
  window['env'].noteMaximumSize = 5000; // in kilobytes
})(this);
