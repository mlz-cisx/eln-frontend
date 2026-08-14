(function (window) {
  window.env = window.env || {};
  window["env"].apiUrl = "http://localhost:8010/api";
  window["env"].wsUrl = "ws://localhost:4501/ws";
  window['env'].labBookSocketRefreshInterval = 1000;
  window['env'].keycloak_integration = true;
  window['env'].instr_csv_all = true;
  window['env'].noteMaximumSize = 5000; // in kilobytes

  // HSDS defaults
  window['env'].hsds_url = '';
  window['env'].hsds_username = '';
  window['env'].hsds_password = '';
  window['env'].hsds_domain = '';

})(this);
