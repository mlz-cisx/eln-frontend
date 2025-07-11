import {Injectable} from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpRequest,
  HttpResponse,
  HttpErrorResponse,
  HttpInterceptor
} from '@angular/common/http';
import {EMPTY, Observable, Subject} from 'rxjs';
import {map, switchMap, take, filter} from 'rxjs/operators';
import {Router} from '@angular/router';

import {tap, catchError} from 'rxjs/operators';
import {AuthService, UserService, LogoutService} from "@app/services";

@Injectable({
  providedIn: 'root'
})

export class InterceptorService implements HttpInterceptor {

  private isRefreshing = false;
  private refreshToken = new Subject<string | null>();

  constructor(
    private _auth: AuthService,
    private _user: UserService,
    private _logout: LogoutService,
  ) {
  }

  public intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = this._auth.getToken();
    if (token) {
      request = this.appendToken(request, token);
    }
    return next.handle(request).pipe(catchError((error: HttpErrorResponse) => {
      if (error.status == 401 && this._auth.getToken()) {
        return this.handle401Error(request, next);
      }
      this._logout.logout();
      return EMPTY;
      })
    );
  }

  private appendToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({headers: request.headers.set('Accept', 'application/json')}).clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshToken.next(null);

      return this._user.refreshToken().pipe(
        switchMap((newToken: string) => {
          this.isRefreshing = false;
          this.refreshToken.next(newToken);
          return next.handle(this.appendToken(request, newToken));
        })
      );
    // if refresh is already started, wait untill it finish
    } else {
      return this.refreshToken.pipe(filter((token) => token !== null),
        take(1),
        switchMap((token) => {
          return next.handle(this.appendToken(request, token!));
        })
      );
    }
  }
}
