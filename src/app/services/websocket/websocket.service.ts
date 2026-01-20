import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import {Subject, Subscription} from 'rxjs';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import {AuthService} from "@app/services";


@Injectable({
  providedIn: 'root',
})
export class WebSocketService {

  public constructor(
    private _auth: AuthService,
  ) {
  }

  public elements = new Subject<any>();
  private socket$?: WebSocketSubject<any>;
  private socketSub?: Subscription;

  public connect(): void {
    // Close old socket
    if (this.socket$ && !this.socket$.closed) {
      this.socket$.complete();
    }
    this.socketSub?.unsubscribe();

    const token = this._auth.getToken();
    if (!token) return;

    this.socket$ = webSocket(`${environment.wsUrl}/jwt_${token}`);

    this.socketSub = this.socket$.subscribe({
      next: msg => this.elements.next(msg),
      error: err => console.error('WS error', err),
      complete: () => console.log('WS closed')
    });
  }

  public close(): void {
    this.socketSub?.unsubscribe();
    this.socket$?.complete();
  }

}
