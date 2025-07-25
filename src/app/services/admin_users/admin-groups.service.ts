import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import type {TableViewService} from '@joeseln/table';
import type {Group, GroupPayload, User} from '@joeseln/types';
import type {Observable} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {ErrorserviceService, LogoutService} from "@app/services";


@Injectable({
  providedIn: 'root',
})
export class AdminGroupsService implements TableViewService {

  public readonly apiUrl = `${environment.apiUrl}/admin/groups/`;

  constructor(private readonly httpClient: HttpClient,
              private readonly errorservice: ErrorserviceService,
              private logout: LogoutService) {
  }

  public getList(params = new HttpParams()): Observable<{ total: number; data: [] }> {
    return this.httpClient.get<[]>(this.apiUrl, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)),
      map(data => ({
        total: data.length,
        data: data,
      }))
    );
  }


  public getpagetitle(id: string, params = new HttpParams()): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}${id}/`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)),
      map(data => {
        return data;
      })
    );
  }

  public delete(id: string, params = new HttpParams()): Observable<any> {
    return this.httpClient.patch<any>(`${this.apiUrl}${id}/soft_delete/`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }

  public restore(id: string, params = new HttpParams()): Observable<User> {
    return this.httpClient.patch<User>(`${this.apiUrl}${id}/restore/`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }

  public add(group: GroupPayload): Observable<Group> {
    return this.httpClient.post<Group>(this.apiUrl, group).pipe(catchError(err => this.errorservice.handleError(err, this.logout)));
  }
}
