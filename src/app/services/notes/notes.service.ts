import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import type {TableViewService} from '@joeseln/table';
import type {
  ExportLink,
  ExportService,
  FinalizeVersion,
  Note,
  Note_with_privileges,
  NotePayload,
  PrivilegesData,
  RecentChanges,
  RecentChangesService,
  Relation,
  Version,
  VersionsService,
} from '@joeseln/types';
import type {Observable} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {ErrorserviceService, LogoutService} from "@app/services";


@Injectable({
  providedIn: 'root',
})
export class NotesService
  implements TableViewService, RecentChangesService, VersionsService<Note>, ExportService {
  public readonly apiUrl = `${environment.apiUrl}/notes/`;


  public constructor(private readonly httpClient: HttpClient,
                     private readonly errorservice: ErrorserviceService,
                     private logout: LogoutService) {
  }

  public getList(params = new HttpParams()): Observable<{ total: number; data: Note[] }> {
    return this.httpClient.get<Note[]>(this.apiUrl, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)),
      map(data => ({
        total: data.length,
        data: data,
      }))
    );
  }

  public add(note: NotePayload, params = new HttpParams()): Observable<Note> {
    return this.httpClient.post<Note>(this.apiUrl, note, {params});
  }


  public get(id: string, params = new HttpParams()): Observable<PrivilegesData<Note>> {
    return this.httpClient.get<Note_with_privileges>(`${this.apiUrl}${id}/`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)),
      map(note => {
        let privileges = note.privileges
        const privilegesData: PrivilegesData<Note> = {
          privileges,
          data: note.note,
        };
        return privilegesData;
      })
    );
  }


  public delete(id: string, labbook_pk: string, params = new HttpParams()): Observable<Note> {
    return this.httpClient.patch<Note>(`${this.apiUrl}${id}/soft_delete/`, {labbook_pk: labbook_pk}, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }

  public patch(id: string, note: NotePayload, params = new HttpParams()): Observable<Note> {
    return this.httpClient.patch<Note>(`${this.apiUrl}${id}/`, note, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }

  public restore(id: string, params = new HttpParams()): Observable<Note> {
    return this.httpClient.patch<Note>(`${this.apiUrl}${id}/restore/`, {pk: id}, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }

  public history(id: string, params = new HttpParams()): Observable<RecentChanges[]> {
    return this.httpClient.get<RecentChanges[]>(`${this.apiUrl}${id}/history/`, {params});
  }


  public versions(id: string, params = new HttpParams()): Observable<Version[]> {
    return this.httpClient.get<Version[]>(`${this.apiUrl}${id}/versions/`, {params});
  }

  public previewVersion(id: string, version: string): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}${id}/versions/${version}/preview/`);
  }

  public addVersion(id: string, version?: FinalizeVersion): Observable<Note> {
    return this.httpClient.post<Note>(`${this.apiUrl}${id}/versions/`, version);
  }


  public restoreVersion(id: string, version: string, versionInProgress: boolean): Observable<Note> {
    return this.httpClient.post<Note>(`${this.apiUrl}${id}/versions/${version}/restore/`, {pk: id});
  }


  public export(id: string): Observable<ExportLink> {
    return this.httpClient.get<ExportLink>(`${this.apiUrl}${id}/get_export_link/`);
  }

  public getRelations(id: string, params = new HttpParams()): Observable<{ total: number; data: Relation[] }> {
    return this.httpClient.get<Relation[]>(`${this.apiUrl}${id}/relations/`, {params}).pipe(
      map(data => ({
        total: data.length,
        data: data,
      }))
    );
  }


  public deleteRelation(id: string, relationId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}${id}/relations/${relationId}/`);
  }
}
