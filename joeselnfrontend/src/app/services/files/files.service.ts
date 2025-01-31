/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
//import { PrivilegesService } from '@app/services/privileges/privileges.service';
import {environment} from '@environments/environment';
import type {TableViewService} from '@joeseln/table';
import type {
  DjangoAPI,
  ExportLink,
  ExportService,
  File, File_with_privileges,
  FilePayload,
  FinalizeVersion,
  LockService,
  PermissionsService,
  Privileges,
  PrivilegesApi,
  PrivilegesData,
  RecentChanges,
  RecentChangesService,
  Relation,
  RelationPayload,
  RelationPutPayload,
  Version,
  VersionsService,
} from '@joeseln/types';
import type {Observable} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';
import type {Optional} from 'utility-types';
import {BehaviorSubject} from "rxjs";
import {
  mockFileHistory,
  mockNoteVersion,
  mockPictureHistory,
  mockPrivileges
} from "@joeseln/mocks";
import {LogoutService, ErrorserviceService} from "@app/services";
import {Note} from "@joeseln/types";

@Injectable({
  providedIn: 'root',
})
export class FilesService
  implements TableViewService, RecentChangesService, VersionsService<File>, LockService, ExportService, PermissionsService {
  public readonly apiUrl = `${environment.apiUrl}/files/`;

  public privileges_list$ = new BehaviorSubject<any>('');

  public constructor(private readonly httpClient: HttpClient,
                     private readonly errorservice: ErrorserviceService,
                     private authguard: LogoutService) {
  }

  public getList(params = new HttpParams()): Observable<{ total: number; data: File[] }> {
    return this.httpClient.get<File[]>(this.apiUrl, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.authguard)),
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
    return this.httpClient.post<File>(this.apiUrl, formData, {params});
  }

  public get(id: string, params = new HttpParams()): Observable<PrivilegesData<File>> {
    return this.httpClient.get<File_with_privileges>(`${this.apiUrl}${id}/`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.authguard)),
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

  public _get(id: string, userId: number, params = new HttpParams()): Observable<PrivilegesData<File>> {
    return this.httpClient.get<File>(`${this.apiUrl}${id}/`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.authguard)),
      switchMap(file =>
        this.getUserPrivileges(id, userId, file.deleted).pipe(
          map(privileges => {
            const privilegesData: PrivilegesData<File> = {
              privileges,
              data: file,
            };
            return privilegesData;
          })
        )
      )
    );
  }

  public getPrivilegesList(id: string): Observable<PrivilegesApi[]> {
    return this.httpClient.get<PrivilegesApi[]>(`${this.apiUrl}${id}/privileges/`);
  }


  public getUserPrivileges(id: string, userId: number, deleted: boolean): Observable<Privileges> {
    return this.privileges_list$.pipe(
      map(() => {
          return mockPrivileges
        }
      )
    )
  }

  public addUserPrivileges(id: string, userId: number): Observable<PrivilegesApi> {
    return this.httpClient.post<PrivilegesApi>(
      `${this.apiUrl}${id}/privileges/`,
      {
        user_pk: userId,
        view_privilege: 'AL',
      },
      {
        params: new HttpParams().set('pk', userId.toString()),
      }
    );
  }

  public putUserPrivileges(id: string, userId: number, privileges: PrivilegesApi): Observable<PrivilegesApi> {
    return this.httpClient.put<PrivilegesApi>(`${this.apiUrl}${id}/privileges/${userId}/`, privileges);
  }

  public deleteUserPrivileges(id: string, userId: number): Observable<PrivilegesApi[]> {
    return this.httpClient.delete(`${this.apiUrl}${id}/privileges/${userId}/`).pipe(switchMap(() => this.getPrivilegesList(id)));
  }

  public delete(id: string, labbook_pk: string, params = new HttpParams()): Observable<File> {
    return this.httpClient.patch<File>(`${this.apiUrl}${id}/soft_delete/`, {labbook_pk: labbook_pk}, {params});
  }

  public patch(id: string, task: Optional<FilePayload>, params = new HttpParams()): Observable<File> {
    return this.httpClient.patch<File>(`${this.apiUrl}${id}/`, {pk: id, ...task}, {params});
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


  public old_previewVersion(id: string, version: string): Observable<any> {
    return this.privileges_list$.pipe(
      map(() => {
          return mockNoteVersion.metadata
        }
      )
    )
  }


  // TODO: needs proper interface for return type, maybe with a generic?
  public previewVersion(id: string, version: string): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}${id}/versions/${version}/preview/`);
  }


  public addVersion(id: string, version?: FinalizeVersion): Observable<File> {
    console.log(version)
    return this.httpClient.post<File>(`${this.apiUrl}${id}/versions/`, version);
  }

  public restoreVersion(id: string, version: string, versionInProgress: boolean): Observable<File> {
    // if (versionInProgress) {
    //   return this.addVersion(id).pipe(
    //     switchMap(() => this.httpClient.post<File>(`${this.apiUrl}${id}/versions/${version}/restore/`, {pk: id}))
    //   );
    // }

    return this.httpClient.post<File>(`${this.apiUrl}${id}/versions/${version}/restore/`, {pk: id});
  }

  public lock(id: string, params = new HttpParams()): Observable<void> {
    return this.httpClient.post<void>(`${this.apiUrl}${id}/lock/`, undefined, {params});
  }

  public unlock(id: string, params = new HttpParams()): Observable<void> {
    return this.httpClient.post<void>(`${this.apiUrl}${id}/unlock/`, undefined, {params});
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

  public updateFile(id: string, file: any, params = new HttpParams()): Observable<File> {
    const formData = new FormData();
    formData.append('pk', id);
    formData.append('path', file);
    return this.httpClient.patch<File>(`${this.apiUrl}${id}/`, formData, {params});
  }
}
