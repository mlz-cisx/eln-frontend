/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {Injectable} from '@angular/core';
// import { UserService } from '@app/stores/user';
import {environment} from '@environments/environment';
import type {WebSocketElementPayload} from '@joeseln/types';
import {Subject} from 'rxjs';
import {webSocket} from 'rxjs/webSocket';
import {AuthService} from "@app/services";
import {KeycloakService} from "keycloak-angular";
import {Centrifuge} from 'centrifuge';


@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  public notifications = new Subject();

  public elements = new Subject();

  public elementsConnection = webSocket(`${environment.wsUrl}/pathvalue`);

  private keycloak_integration = environment.keycloak_integration

  public subscribedElements: WebSocketElementPayload[] = [];

  public constructor(
    private _auth: AuthService,
    protected readonly keycloak: KeycloakService
  ) {
  }


  public connect(): void {
    let token
    if (this.keycloak_integration && Object(this.keycloak.getToken())['__zone_symbol__value']) {
      token = 'oidc_' + Object(this.keycloak.getToken())['__zone_symbol__value']
    } else if (this._auth.getToken()) {
      token = 'jwt_' + this._auth.getToken()
    } else token = ''

    const ws_with_path = webSocket((`${environment.wsUrl}/${token}`))
    ws_with_path.subscribe({next: msg => this.elements.next(msg)});
    ws_with_path.next({
      action: 'connect',
      auth: ''
    });
  }

  // we will not use it anymore, because of ws unidirectional approach
  public subscribe(elements: WebSocketElementPayload[]): void {
    for (const element of elements) {
      this.subscribedElements = [...this.subscribedElements, element];
      this.elementsConnection.next({
        auth: this._auth.getToken() || this.keycloak.getToken(),
        action: 'subscribe',
        model_name: element.model,
        model_pk: element.pk
      });
      //console.log(this.subscribedElements)
    }
  }

  // we will not use it anymore, because of ws unidirectional approach
  public unsubscribe(): void {
    for (const element of this.subscribedElements) {
      this.elementsConnection.next({
        auth: null,
        action: 'unsubscribe',
        model_name: element.model,
        model_pk: element.pk
      });
    }
    this.subscribedElements = [];
  }
}
