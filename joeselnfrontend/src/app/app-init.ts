import type {KeycloakService} from 'keycloak-angular';

export function keycloak_initializer(keycloak: KeycloakService): () => Promise<any> {

  // @ts-ignore
  return () =>
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    keycloak.init({
      config: {
        url: 'http://172.25.74.236:8181/',
        realm: 'joe',
        clientId: 'my_client'
      },
      loadUserProfileAtStartUp: false,
      initOptions: {
        onLoad: 'check-sso',
        checkLoginIframe: false,
      },
      bearerExcludedUrls: []
    }).then(() => {
      void keycloak.getToken().then(token => {
      })
    }).catch((error) =>
      console.error('Keycloak login failed: ', error),
    );
}

