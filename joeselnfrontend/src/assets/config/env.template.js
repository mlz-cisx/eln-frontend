(function(window) {
  window.env = window.env || {};
  window['env'].apiUrl = '${API_URL}';
  window['env'].wsUrl = '${WS_URL}';
  window['env'].labBookSocketRefreshInterval = '${LAB_BOOK_SOCKET_REFRESH_INTERVAL}';
  window['env'].keycloak_url = '${KEYCLOAK_URL}';
  window['env'].keycloak_realm = '${KEYCLOAK_REALM}';
  window['env'].keycloak_clientId = '${KEYCLOAK_CLIENT_ID}';
  window['env'].keycloak_integration = '${KEYCLOAK_INTEGRATION}';
  window['env'].noteMaximumSize = '${NOTE_MAXIMUM_SIZE}'; // in kilobytes
})(this);
