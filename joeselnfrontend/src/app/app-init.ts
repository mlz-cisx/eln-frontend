import type {KeycloakService} from 'keycloak-angular';
import {environment} from '@environments/environment';

export function keycloak_initializer(keycloak: KeycloakService): () => Promise<any> {

  if (environment.keycloak_integration) {


    // @ts-ignore
    return () =>
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      keycloak.init({
        config: {
          url: environment.keycloak_url,
          realm: environment.keycloak_realm,
          clientId: environment.keycloak_clientId
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

  return (): Promise<any> => {
    return Promise.resolve();

  }
}

