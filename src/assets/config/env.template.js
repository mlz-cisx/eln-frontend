(function (window) {
  window.env = window.env || {};
  window['env'].apiUrl = '${API_URL}';
  window['env'].labBookSocketRefreshInterval = '${LAB_BOOK_SOCKET_REFRESH_INTERVAL}' || 1000;
  window['env'].keycloak_integration = '${KEYCLOAK_INTEGRATION}' === 'true';
  const rawInstrCsvAll = '${INSTR_CSV_ALL}';
  window['env'].instr_csv_all = rawInstrCsvAll ? rawInstrCsvAll === 'true' : true;
  window['env'].noteMaximumSize = '${NOTE_MAXIMUM_SIZE}' || 5000; // in kilobytes

  // HSDS defaults
  window['env'].hsds_url = '${HSDS_URL}' || '';
  window['env'].hsds_username = '${HSDS_USERNAME}' || '';
  window['env'].hsds_password = '${HSDS_PASSWORD}' || '';
  window['env'].hsds_domain = '${HSDS_DOMAIN}' || '';

})(this);
