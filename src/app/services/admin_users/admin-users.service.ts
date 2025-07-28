import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import type {TableViewService} from '@joeseln/table';
import type {
  PasswordPatchPayload,
  PrivilegesData,
  User,
  User_with_privileges,
  UserPatchPayload,
  UserPayload,
} from '@joeseln/types';
import type {Observable} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {ErrorserviceService, LogoutService} from "@app/services";

@Injectable({
  providedIn: 'root',
})
export class AdminUsersService implements TableViewService {

  public readonly apiUrl = `${environment.apiUrl}/admin/users/`;

  constructor(private readonly httpClient: HttpClient,
              private readonly errorservice: ErrorserviceService,
              private logout: LogoutService) {
  }

  public getList(params = new HttpParams()): Observable<{ total: number; data: User[] }> {
    return this.httpClient.get<User[]>(this.apiUrl, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)),
      map(data => ({
        total: data.length,
        data: data,
      }))
    );
  }

  public get(id: string, params = new HttpParams()): Observable<PrivilegesData<User>> {
    return this.httpClient.get<User_with_privileges>(`${this.apiUrl}${id}/`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)),
      map(user => {
        let privileges = user.privileges
        const privilegesData: PrivilegesData<User> = {
          privileges,
          data: user.user,
        };
        return privilegesData;
      })
    );

  }

  public delete(id: string, params = new HttpParams()): Observable<User> {
    return this.httpClient.patch<User>(`${this.apiUrl}${id}/soft_delete/`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }

  public restore(id: string, params = new HttpParams()): Observable<User> {
    return this.httpClient.patch<User>(`${this.apiUrl}${id}/restore/`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }

  public add(user: UserPayload): Observable<User> {
    return this.httpClient.post<User>(this.apiUrl, user).pipe(catchError(err => this.errorservice.handleError(err, this.logout)));
  }

  public patch(id: string, user: UserPatchPayload, params = new HttpParams()): Observable<User> {
    return this.httpClient.patch<User>(`${this.apiUrl}${id}/`, user, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }

  public patch_password(id: string, password: PasswordPatchPayload, params = new HttpParams()): Observable<User> {
    return this.httpClient.patch<User>(`${this.apiUrl}${id}/foo/`, password, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }
}
