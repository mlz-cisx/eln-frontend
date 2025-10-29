import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {environment} from '@environments/environment';
import type {
  Note,
  File,
  Picture,
  ExportLink,
  FinalizeVersion,
  Lab_Book,
  LabBook,
  LabBookElement,
  LabBookElementPayload,
  LabBookPayload,
  Privileges,
  PrivilegesData,
  RecentChanges,
  Version,
} from '@joeseln/types';
import {catchError, map} from 'rxjs/operators';
import {Observable} from "rxjs";
import {ErrorserviceService, LogoutService} from "@app/services";


@Injectable({
  providedIn: 'root'
})
export class LabbooksService {

  public readonly apiUrl = `${environment.apiUrl}/labbooks/`;


  constructor(private readonly httpClient: HttpClient,
              private readonly errorservice: ErrorserviceService,
              private logout: LogoutService
  ) {
  }

  public getList(params = new HttpParams()): Observable<{ total: number; data: LabBook[] }> {
    return this.httpClient.get<LabBook[]>(this.apiUrl, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)),
      map(data => ({
        total: data.length,
        data: data,
      }))
    );
  }


  public add(labbook: LabBookPayload): Observable<LabBook> {
    return this.httpClient.post<LabBook>(this.apiUrl, labbook).pipe(catchError(err => this.errorservice.handleError(err, this.logout)));
  }




  public get(id: string, params = new HttpParams()): Observable<PrivilegesData<LabBook>> {
    return this.httpClient.get<Lab_Book>(`${this.apiUrl}${id}`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)),
      map(labBook => {
        let privileges = labBook.privileges
        const privilegesData: PrivilegesData<LabBook> = {
          privileges,
          data: labBook.labbook,
        };
        return privilegesData;
      })
    );
  }


  public getUserPrivileges(id: string, userId: number, deleted: boolean): Observable<Privileges> {
    return this.httpClient
      .get<Privileges>(`${this.apiUrl}${id}/privileges/${userId}/`)
  }

  public patch(id: string, labbook: LabBookPayload): Observable<LabBook> {
    return this.httpClient.patch<LabBook>(`${this.apiUrl}${id}/`, labbook);
  }

  public restore(id: string): Observable<LabBook> {
    return this.httpClient.patch<LabBook>(`${this.apiUrl}${id}/restore/`, {}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }

  public delete(id: string): Observable<LabBook> {
    return this.httpClient.patch<LabBook>(`${this.apiUrl}${id}/soft_delete/`, {}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }

  public getElements(id: string, section?: string): Observable<LabBookElement<any>[]> {
    return this.httpClient.get<LabBookElement<any>[]>(`${this.apiUrl}${id}/elements/`).pipe(catchError(err => this.errorservice.handleError(err, this.logout)))
  }

  public addElement(id: string, element: LabBookElementPayload): Observable<LabBookElement<any>> {
    return this.httpClient.post<LabBookElement<any>>(`${this.apiUrl}${id}/elements/`, element).pipe(catchError(err => this.errorservice.handleError(err, this.logout)));
  }

  public addElementBottom(id: string, element: LabBookElementPayload): Observable<LabBookElement<Note | File | Picture | null>> {
    return this.httpClient.post<LabBookElement<null>>(`${this.apiUrl}${id}/elements/bottom`, element).pipe(catchError((err: HttpErrorResponse) => this.errorservice.handleError(err, this.logout)));
  }

  public patchElement(id: string, elementId: string, element: LabBookElementPayload): Observable<LabBookElement<any>> {
    return this.httpClient.patch<LabBookElement<any>>(`${this.apiUrl}${id}/elements/${elementId}/`, element);
  }

  public deleteElement(id: string, elementId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}${id}/elements/${elementId}/`);
  }

  public updateAllElements(id: string, elements: LabBookElementPayload[]): Observable<string[]> {
    return this.httpClient.put<string[]>(`${this.apiUrl}${id}/elements/update_all/`, elements).pipe(catchError(err => this.errorservice.handleError(err, this.logout)));
  }

  public history(id: string, params = new HttpParams()): Observable<RecentChanges[]> {
    return this.httpClient.get<RecentChanges[]>(`${this.apiUrl}${id}/history/`, {params});
  }

  public create_note_aside(elem_id: string, params = new HttpParams()): Observable<Boolean> {
    return this.httpClient.get<any>(`${this.apiUrl}note_aside/${elem_id}/`, {params});
  }

  public create_note_below(elem_id: string, params = new HttpParams()): Observable<Boolean> {
    return this.httpClient.get<any>(`${this.apiUrl}note_below/${elem_id}/`, {params});
  }

  public versions(id: string, params = new HttpParams()): Observable<Version[]> {
    return this.httpClient.get<Version[]>(`${this.apiUrl}${id}/versions/`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }

  public previewVersion(id: string, version: string): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}${id}/versions/${version}/preview/`);
  }

  public addVersion(id: string, version?: FinalizeVersion): Observable<LabBook> {
    return this.httpClient.post<LabBook>(`${this.apiUrl}${id}/versions/`, version);
  }

  public restoreVersion(id: string, version: string, versionInProgress: boolean): Observable<LabBook> {
    return this.httpClient.post<LabBook>(`${this.apiUrl}${id}/versions/${version}/restore/`, {pk: id});
  }

  public export(id: string): Observable<ExportLink> {
    return this.httpClient.get<ExportLink>(`${this.apiUrl}${id}/get_export_link/`);
  }

}
