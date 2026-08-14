import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable, Subject } from 'rxjs';
import { AuthService } from "@app/services";


@Injectable({
  providedIn: 'root',
})
export class WebSocketService {

  public constructor(
    private _auth: AuthService,
  ) {
  }

  /** ref-counted channel registry: one Subject per element/labbook key. */
  private channels = new Map<string, Subject<any>>();
  private refs = new Map<string, number>();

  private eventSource?: EventSource;

  public connect(): void {
    // Close old stream
    this.close();

    const token = this._auth.getToken();
    if (!token) return;

    // EventSource cannot set the Authorization header,
    // so the JWT travels as a query parameter, the same
    // way the old WebSocket URL carried it.
    const url = `${environment.apiUrl}/events?token=${encodeURIComponent(token)}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event: MessageEvent) => {
      try {
        this.dispatch(JSON.parse(event.data));
      } catch (e) {
        console.error('SSE parse error', e);
      }
    };
    // EventSource reconnects automatically with backoff; onerror is
    // informational. A failed reconnect is retried by the browser.
    this.eventSource.onerror = (err) => console.error('SSE error', err);
  }

  /**
   * route an incoming message.
   * labbook-scoped messages go to the single per-labbook channel; element-scoped
   * messages go to the single per-pk channel, so unrelated components are not woken.
   */
  private dispatch(msg: any): void {
    if (msg?.model_name === 'labbook' || msg?.model_pk === undefined) {
      // labbook-scoped notification: wake only that labbook view
      this.channels.get(msg?.model_pk ?? msg?.pk)?.next(msg);
      return;
    }
    this.channels.get(msg.model_pk)?.next(msg);
  }

  /**
   * subscribe to messages for a single key (an element pk or a labbook id).
   * Each key gets its own channel so an update wakes only what it targets.
   * Ref-counted; released via the matching unsubscribe<noun> method.
   */
  private subscribeChannel(key: string): Observable<any> {
    let channel = this.channels.get(key);
    if (!channel) {
      channel = new Subject<any>();
      this.channels.set(key, channel);
    }
    this.refs.set(key, (this.refs.get(key) ?? 0) + 1);
    return channel.asObservable();
  }

  /** release a channel when its component is destroyed */
  private unsubscribeChannel(key: string): void {
    const remaining = (this.refs.get(key) ?? 1) - 1;
    if (remaining <= 0) {
      this.channels.get(key)?.complete();
      this.channels.delete(key);
      this.refs.delete(key);
    } else {
      this.refs.set(key, remaining);
    }
  }

  /** subscribe to messages for a single content object (a note/picture/file pk). */
  public subscribeElement(pk: string): Observable<any> {
    return this.subscribeChannel(pk);
  }

  /** release a content-object channel when its component is destroyed. */
  public unsubscribeElement(pk: string): void {
    this.unsubscribeChannel(pk);
  }

  /** subscribe to messages for a whole labbook view. */
  public subscribeLabbook(labbookPk: string): Observable<any> {
    return this.subscribeChannel(labbookPk);
  }

  /** release a labbook channel when its view is destroyed. */
  public unsubscribeLabbook(labbookPk: string): void {
    this.unsubscribeChannel(labbookPk);
  }

  public close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
  }

}
