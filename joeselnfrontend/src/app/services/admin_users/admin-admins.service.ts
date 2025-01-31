import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
// import {PrivilegesService} from '@app/services/privileges/privileges.service';
import {environment} from '@environments/environment';
import type {TableViewService} from '@joeseln/table';
import type {
  DjangoAPI,
  ExportLink,
  ExportService,
  FinalizeVersion,
  LockService,
  Note, Note_with_privileges,
  NotePayload,
  PermissionsService,
  Privileges,
  PrivilegesApi,
  PrivilegesData,
  RecentChanges,
  RecentChangesService,
  Relation,
  RelationPayload,
  RelationPutPayload, User, User_with_privileges, UserPayload,
  Version,
  VersionsService,
} from '@joeseln/types';
import type {Observable} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';
import {BehaviorSubject} from "rxjs";
import {
  mockLabBooksList,
  mockLabBookVersion, mockNotesList,
  mockNoteVersion,
  mockPrivileges
} from "@joeseln/mocks";
import {
  ErrorserviceService,
  LogoutService
} from "@app/services";
import {Lab_Book, LabBook, LabBookPayload} from "@joeseln/types";

@Injectable({
  providedIn: 'root',
})
export class AdminAdminsService implements TableViewService {

  public readonly apiUrl = `${environment.apiUrl}/admin/admins/`;

  constructor(private readonly httpClient: HttpClient,
              private readonly errorservice: ErrorserviceService,
              private authguard: LogoutService) {
  }

  public getList(params = new HttpParams()): Observable<{ total: number; data: User[] }> {
    return this.httpClient.get<User[]>(this.apiUrl, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.authguard)),
      map(data => ({
        total: data.length,
        data: data,
      }))
    );
  }

  public get(id: string, params = new HttpParams()): Observable<PrivilegesData<User>> {
    return this.httpClient.get<User_with_privileges>(`${this.apiUrl}${id}/`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.authguard)),
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

  // delete here is removing admin role
  public delete(id: string, params = new HttpParams()): Observable<User> {
    return this.httpClient.patch<User>(`${this.apiUrl}${id}/soft_delete/`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.authguard)), map(data => data));
  }

  // restore here is adding admin role
  public restore(id: string, params = new HttpParams()): Observable<User> {
    return this.httpClient.patch<User>(`${this.apiUrl}${id}/restore/`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.authguard)), map(data => data));
  }

  // no adding
  public add(user: UserPayload): Observable<User> {
    return this.httpClient.post<User>(this.apiUrl, user).pipe(catchError(err => this.errorservice.handleError(err, this.authguard)));
  }
}
