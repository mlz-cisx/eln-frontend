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


@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  public notifications = new Subject();

  public elements = new Subject();

  public notificationsConnection = webSocket(`${environment.wsUrl}/notifications/`);

  public elementsConnection = webSocket(`${environment.wsUrl}/elements/`);

  public subscribedElements: WebSocketElementPayload[] = [];

  public constructor(
    private _auth: AuthService,
    protected readonly keycloak: KeycloakService
  ) {
  }

  public connect(): void {
    this.elementsConnection.subscribe({next: msg => this.elements.next(msg)});
    this.elementsConnection.next({
      action: 'connect',
      auth: this._auth.getToken() || this.keycloak.getToken()
    });
  }

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
