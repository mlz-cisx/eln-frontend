import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {environment} from '@environments/environment';
import {Observable, of, throwError} from 'rxjs';
import {catchError, map, tap, switchMap} from 'rxjs/operators';
import type {KeykloakUser, User, Test} from "@joeseln/types";
import {AuthGuardService, AuthService} from "@app/services";
import {Router} from "@angular/router";
import {KeycloakService} from 'keycloak-angular';
import {UserState, UserStore} from "@app/services/user/user.store";
import {UserQuery} from "@app/services/user/user.query";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private readonly httpClient: HttpClient,
              private _auth: AuthService,
              private router: Router,
              private readonly userStore: UserStore,
              private readonly userQuery: UserQuery,
  ) {

  }


  public login(payload: any): void {
    var data = new FormData()
    data.append('username', payload['username'])
    data.append('password', payload['password'])
    this.httpClient.post(`${environment.apiUrl}/token`, data).pipe(catchError(this.handleError)).subscribe((res: any) => {
      if (res.access_token) {
        this._auth.setDataInLocalStorage('token', res.access_token)
        this.router.navigate(['/profile'])
      }
    })
  }

  public getUserMe(): Observable<User> {
    return this.httpClient.get<User>(`${environment.apiUrl}/users/me`).pipe(catchError(this.handleError))
  }

  public get user$(): Observable<UserState> {
    return this.userQuery.user$ as any;
  }

  public handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error);
    } else {
      if (error.status > 400 && 500 > error.status) {
        localStorage.clear();
        window.location.reload()
      }
      // The response body may contain clues as to what went wrong.
      console.error(
        `Backend returned code ${error.status}, body was: `, error.error);
    }
    // Return an observable with a user-facing error message.
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
}
