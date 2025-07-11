import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {environment} from '@environments/environment';
import {Observable, of, throwError} from 'rxjs';
import {catchError, map, tap, switchMap} from 'rxjs/operators';
import type {User, Test} from "@joeseln/types";
import {LogoutService, AuthService} from "@app/services";
import {Router} from "@angular/router";
import {UserState, UserStore} from "@app/services/user/user.store";
import {UserQuery} from "@app/services/user/user.query";
import {ErrorserviceService} from "@app/services";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private readonly httpClient: HttpClient,
              private _auth: AuthService,
              private router: Router,
              private readonly userStore: UserStore,
              private readonly userQuery: UserQuery,
              private readonly errorservice: ErrorserviceService,
              private logout: LogoutService
  ) {

  }


  public login(payload: any): void {
    var data = new FormData()
    data.append('username', payload['username'])
    data.append('password', payload['password'])
    this.httpClient.post(`${environment.apiUrl}/token`, data).pipe(catchError(err => this.errorservice.handleError(err, this.logout))).subscribe((res: any) => {
      if (res.access_token) {
        this._auth.setDataInLocalStorage('token', res.access_token)
        this.router.navigate(['/'])
      }
    })
  }

  public getUserMe(): Observable<User> {
    return this.httpClient.get<User>(`${environment.apiUrl}/users/me`).pipe(catchError(err => this.errorservice.handleError(err, this.logout)))
  }

  public getUserMe_without_error_service(): Observable<User> {
    return this.httpClient.get<User>(`${environment.apiUrl}/users/me`)
  }

  public changePassword(password: string): Observable<any> {
    return this.httpClient.put<any>(`${environment.apiUrl}/change_password`, {password}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)));
  }

  public get user$(): Observable<UserState> {
    return this.userQuery.user$ as any;
  }

  public refreshToken() {
    return this.httpClient.post<any>(`${environment.apiUrl}/refresh-token`, {
      access_token: this._auth.getToken()
    }).pipe(
      map((res) => {
        if (res.access_token) {
          this._auth.setDataInLocalStorage('token', res.access_token)
          return res.access_token;
        }
      })
    );
  }
}
