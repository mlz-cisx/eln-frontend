import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import {Subject} from 'rxjs';
import {webSocket} from 'rxjs/webSocket';
import {AuthService} from "@app/services";



@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  public notifications = new Subject();

  public elements = new Subject();


  public constructor(
    private _auth: AuthService,
  ) {
  }


  public connect(): void {
    let token = ''
    if (this._auth.getToken()) {
      token = 'jwt_' + this._auth.getToken()
    }

    const ws_with_path = webSocket((`${environment.wsUrl}/${token}`))
    ws_with_path.subscribe({next: msg => this.elements.next(msg)});
    ws_with_path.next({
      action: 'connect',
      auth: ''
    });
  }

}
