import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import {Subject} from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import {AuthService} from "@app/services";



@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket$?: WebSocketSubject<any>; // eslint-disable-line

  public elements = new Subject();


  public constructor(
    private _auth: AuthService,
  ) {
  }

  public connect(): void {

    if (!this.socket$ || this.socket$.closed) {
      let token = '';
      if (this._auth.getToken()) {
        token = 'jwt_' + this._auth.getToken();
      } else return;

      this.socket$ = webSocket(`${environment.wsUrl}/${token}`);
    }

    this.socket$.subscribe({ next: (msg) => this.elements.next(msg) });
  }

  public close() {
    if (this.socket$ && !this.socket$.closed) {
      this.socket$.complete();
    }
  }
}
