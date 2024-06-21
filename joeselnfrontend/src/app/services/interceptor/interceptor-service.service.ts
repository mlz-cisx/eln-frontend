import {Injectable} from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpRequest,
  HttpResponse,
  HttpErrorResponse,
  HttpInterceptor
} from '@angular/common/http';
import {Observable, Subject, of, throwError} from 'rxjs';
import {map} from 'rxjs/operators';
import {Router} from '@angular/router';

import {tap, catchError} from 'rxjs/operators';
import {AuthService} from "@app/services";

@Injectable({
  providedIn: 'root'
})

export class InterceptorService implements HttpInterceptor {

  constructor(
    private _auth: AuthService
  ) {
  }

  public intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (this._auth.getToken()) {
      request = request.clone({headers: request.headers.set('Accept', 'application/json')}).clone({
        setHeaders: {
          Authorization: `Bearer ${this._auth.getToken()}`
        }
      });
      return next.handle(request)
    } else {
      return next.handle(request)
    }

  }
}
