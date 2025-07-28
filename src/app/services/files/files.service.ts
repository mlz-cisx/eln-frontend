import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import type {TableViewService} from '@joeseln/table';
import type {
  ExportLink,
  ExportService,
  File,
  File_with_privileges,
  FileClonePayload,
  FilePayload,
  FinalizeVersion,
  PrivilegesData,
  RecentChanges,
  RecentChangesService,
  Relation,
  RelationPayload,
  Version,
  VersionsService,
} from '@joeseln/types';
import type {Observable} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import type {Optional} from 'utility-types';
import {ErrorserviceService, LogoutService} from "@app/services";


@Injectable({
  providedIn: 'root',
})
export class FilesService
  implements TableViewService, RecentChangesService, VersionsService<File>, ExportService {
  public readonly apiUrl = `${environment.apiUrl}/files/`;


  public constructor(private readonly httpClient: HttpClient,
                     private readonly errorservice: ErrorserviceService,
                     private logout: LogoutService) {
  }

  public getList(params = new HttpParams()): Observable<{ total: number; data: File[] }> {
    return this.httpClient.get<File[]>(this.apiUrl, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)),
      map(data => ({
        total: data.length,
        data: data,
      }))
    );
  }

  public add(file: FilePayload, params = new HttpParams()): Observable<File> {
    const formData = new FormData();
    for (const [key, val] of Object.entries(file)) {
      if (!val) continue;
      if (Array.isArray(val)) {
        val.forEach(v => formData.append(key, v));
        continue;
      }
      formData.append(key, val);
    }
    return this.httpClient.post<File>(this.apiUrl, formData, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }

  public clone(file: FileClonePayload, params = new HttpParams()): Observable<File> {
    const formData = new FormData();
    for (const [key, val] of Object.entries(file)) {
      formData.append(key, val);
    }
    return this.httpClient.post<File>(`${this.apiUrl}clone/`, formData, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }

  public get(id: string, params = new HttpParams()): Observable<PrivilegesData<File>> {
    return this.httpClient.get<File_with_privileges>(`${this.apiUrl}${id}`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)),
      map(file => {
        let privileges = file.privileges
        const privilegesData: PrivilegesData<File> = {
          privileges,
          data: file.file,
        };
        return privilegesData;
      })
    );
  }

  public delete(id: string, labbook_pk: string, params = new HttpParams()): Observable<File> {
    return this.httpClient.patch<File>(`${this.apiUrl}${id}/soft_delete/`, {labbook_pk: labbook_pk}, {params});
  }

  public patch(id: string, task: Optional<FilePayload>, params = new HttpParams()): Observable<File> {
    return this.httpClient.patch<File>(`${this.apiUrl}${id}/`, {pk: id, ...task}, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }

  public restore(id: string, params = new HttpParams()): Observable<File> {
    return this.httpClient.patch<File>(`${this.apiUrl}${id}/restore/`, {pk: id}, {params});
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


  public addVersion(id: string, version?: FinalizeVersion): Observable<File> {
    return this.httpClient.post<File>(`${this.apiUrl}${id}/versions/`, version);
  }

  public restoreVersion(id: string, version: string, versionInProgress: boolean): Observable<File> {
    return this.httpClient.post<File>(`${this.apiUrl}${id}/versions/${version}/restore/`, {pk: id});
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

  public addRelation(id: string, payload: RelationPayload): Observable<Relation> {
    return this.httpClient.post<Relation>(`${this.apiUrl}${id}/relations/`, payload);
  }


  public deleteRelation(id: string, relationId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}${id}/relations/${relationId}/`);
  }

}
