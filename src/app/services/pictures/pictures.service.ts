import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import type {TableViewService} from '@joeseln/table';
import type {
  ExportLink,
  ExportService,
  FinalizeVersion,
  Pic_with_privileges,
  Picture,
  PictureClonePayload,
  PictureEditorPayload,
  PicturePayload,
  PrivilegesData,
  RecentChanges,
  RecentChangesService,
  Relation,
  RelationPayload,
  RelationPutPayload,
  SketchPayload,
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
export class PicturesService
  implements TableViewService, RecentChangesService, VersionsService<Picture>, ExportService {
  public readonly apiUrl = `${environment.apiUrl}/pictures/`;


  public constructor(private readonly httpClient: HttpClient,
                     private readonly errorservice: ErrorserviceService,
                     private logout: LogoutService) {
  }

  public getList(params = new HttpParams()): Observable<{ total: number; data: Picture[] }> {
    return this.httpClient.get<Picture[]>(this.apiUrl, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)),
      map(data => ({
        total: data.length,
        data: data,
      }))
    );
  }

  public add(picture: PicturePayload | SketchPayload, params = new HttpParams()): Observable<Picture> {
    const formData = new FormData();
    for (const [key, val] of Object.entries(picture)) {
      if (!val) continue;
      if (Array.isArray(val)) {
        val.forEach(v => {
          if (val instanceof Blob) {
            formData.append(key, v, v.name);
          } else {
            formData.append(key, v);
          }
        });
        continue;
      } else if (val instanceof Blob) {
        formData.append(key, val, (val as any).name);
      } else {
        formData.append(key, val);
      }
    }
    return this.httpClient.post<Picture>(this.apiUrl, formData, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }

  public clone(picture: PictureClonePayload, params = new HttpParams()): Observable<Picture> {
    const formData = new FormData();
    for (const [key, val] of Object.entries(picture)) {
      formData.append(key, val);
    }
    return this.httpClient.post<Picture>(`${this.apiUrl}clone/`, formData, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }


  public get(id: string, params = new HttpParams()): Observable<PrivilegesData<Picture>> {
    return this.httpClient.get<Pic_with_privileges>(`${this.apiUrl}${id}/`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)),
      map(pic => {
        let privileges = pic.privileges
        const privilegesData: PrivilegesData<Picture> = {
          privileges,
          data: pic.picture,
        };
        return privilegesData;
      })
    );
  }



  public delete(id: string, labbook_pk: string, params = new HttpParams()): Observable<Picture> {
    return this.httpClient.patch<Picture>(`${this.apiUrl}${id}/soft_delete/`, {labbook_pk: labbook_pk}, {params});
  }

  public patch(id: string, task: Optional<PicturePayload>, params = new HttpParams()): Observable<Picture> {
    return this.httpClient.patch<Picture>(`${this.apiUrl}${id}/title/`, {pk: id, ...task}, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }

  public restore(id: string, params = new HttpParams()): Observable<Picture> {
    return this.httpClient.patch<Picture>(`${this.apiUrl}${id}/restore/`, {pk: id}, {params});
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

  public addVersion(id: string, version?: FinalizeVersion): Observable<Picture> {
    return this.httpClient.post<Picture>(`${this.apiUrl}${id}/versions/`, version);
  }

  public restoreVersion(id: string, version: string, versionInProgress: boolean): Observable<Picture> {

    return this.httpClient.post<Picture>(`${this.apiUrl}${id}/versions/${version}/restore/`, {pk: id});
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

  public putRelation(id: string, relationId: string, payload: RelationPutPayload): Observable<Relation> {
    return this.httpClient.put<Relation>(`${this.apiUrl}${id}/relations/${relationId}/`, payload);
  }

  public deleteRelation(id: string, relationId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}${id}/relations/${relationId}/`);
  }

  public uploadImage(id: string, picture: PictureEditorPayload, params = new HttpParams()): Observable<Picture> {
    const formData = new FormData();
    for (const [key, val] of Object.entries(picture)) {
      if (!val) continue;
      if (val instanceof Blob) {
        if (val.size) {
          formData.append(key, val, (val as any).name);
        }
      } else {
        formData.append(key, val);
      }
    }
    return this.httpClient.patch<Picture>(`${this.apiUrl}${id}/`, formData, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }

  public downloadShapes(url: string, params = new HttpParams()): Observable<any> {
    return this.httpClient.get<any>(url, {params});
  }

  public downloadImage(url: string): Observable<Blob> {
    return this.httpClient.get(url, { responseType: 'blob' });
  }
}
