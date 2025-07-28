import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import type {TableViewService} from '@joeseln/table';
import type {User,} from '@joeseln/types';
import type {Observable} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {ErrorserviceService, LogoutService} from "@app/services";


@Injectable({
  providedIn: 'root',
})
export class AdminGroupsGuestsService implements TableViewService {

  public readonly apiUrl = `${environment.apiUrl}/admin/group/groupguests/`;

  constructor(private readonly httpClient: HttpClient,
              private readonly errorservice: ErrorserviceService,
              private logout: LogoutService) {
  }

  public getList(params = new HttpParams(), customId?: string): Observable<{ total: number; data: User[] }> {
    return this.httpClient.get<User[]>(`${this.apiUrl}${customId}/`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)),
      map(data => ({
        total: data.length,
        data: data,
      }))
    );
  }


  public delete(id: string, customId?: string, params = new HttpParams()): Observable<User> {
    return this.httpClient.patch<User>(`${this.apiUrl}${customId}/${id}/soft_delete/`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }

  public restore(id: string, customId?: string, params = new HttpParams()): Observable<User> {
    return this.httpClient.patch<User>(`${this.apiUrl}${customId}/${id}/restore/`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }

}
