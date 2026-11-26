import {Injectable} from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import {ToastrService} from 'ngx-toastr';
import {TranslocoService} from '@jsverse/transloco';
import {EMPTY, Observable, of, Subject, throwError} from 'rxjs';
import {catchError, defaultIfEmpty, finalize, switchMap, take, timeout} from 'rxjs/operators';
import {environment} from '@environments/environment';
import {AuthService, LogoutService, UserService} from "@app/services";

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
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
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
        if (request.url === `${environment.apiUrl}/refresh-token`) {
          return throwError(() => error);
        }
        if (error.status === 401 && this._auth.getToken()) {
          return this.handle401Error(request, next);
        }
        this._logout.logout();
        this.toastrService.error(error.message);
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
        timeout(5000),
        switchMap((newToken: string) => {
          this.isRefreshing = false;
          this.refreshToken.next(newToken || null);
          return newToken ? next.handle(this.appendToken(request, newToken)) : EMPTY;
        }),
        catchError(() => {
          // log user out immediately if refresh-token encounter any error
          this._logout.logout();
          this.translocoService.selectTranslate('auth.sessionTimeout').pipe(
            take(1),
            timeout(1000),
            defaultIfEmpty(''),
            catchError(() => of(''))
          ).subscribe((message) => this.toastrService.error(message || 'Session timed out'));
          return EMPTY;
        }),
        finalize(() => {
          this.isRefreshing = false;
          this.refreshToken.next(null);
        })
      );
    // if refresh is already started, wait untill it finish
    } else {
      return this.refreshToken.pipe(
        take(1),
        switchMap((token) => {
          return token ? next.handle(this.appendToken(request, token)) : EMPTY;
        })
      );
    }
  }
}
