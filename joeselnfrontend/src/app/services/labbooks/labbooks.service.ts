import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import {PrivilegesService} from '@app/services/privileges/privileges.service';
import type {
  DjangoAPI,
  ExportLink,
  ExportService,
  FinalizeVersion, Lab_Book,
  LabBook,
  LabBookElement,
  LabBookElementPayload,
  LabBookPayload,
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
import type {OperatorFunction} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';
import {
  mockLabBook,
  mockLabBooksList,
  mockLabBookHistory,
  mockLabBookPayload,
  mockLabBookNoteElement,
  mockLabBookPluginInstanceElement,
  mockLabBookVersion,
  mockLabBookSection,
  mockLabBookSectionPayload,
  mockNotesList,
  mockPrivileges,
  mockNotePayload,
  mockExportLink,
  mockRelationList, mockRelation, MockService,
} from "@joeseln/mocks";
import {BehaviorSubject, Observable, of} from "rxjs";
import {ErrorserviceService} from "@app/services";
import {AuthGuardService} from "@app/services";

@Injectable({
  providedIn: 'root'
})
export class LabbooksService {

  public readonly apiUrl = `${environment.apiUrl}/labbooks/`;


  public lab_book_list$ = new BehaviorSubject<any>('');

  constructor(public mockService: MockService,
              private readonly httpClient: HttpClient,
              private readonly privilegesService: PrivilegesService,
              private readonly errorservice: ErrorserviceService,
              private authguard: AuthGuardService
  ) {
  }

  public getList(params = new HttpParams()): Observable<{ total: number; data: LabBook[] }> {
    return this.httpClient.get<LabBook[]>(this.apiUrl, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.authguard)),
      map(data => ({
        total: data.length,
        data: data,
      }))
    );
  }

  public search(search: string): Observable<LabBook[]> {
    return this.lab_book_list$.pipe(
      map(() => {
          return mockLabBooksList.results
        }
      )
    )
  }

  // public add_old(labbook: LabBookPayload): Observable<LabBook> {
  //   console.log('Labbook payload', labbook)
  //   console.log('payload mock', mockLabBookPayload)
  //   return this.lab_book_list$.pipe(
  //     map((elem) => {
  //         return mockLabBooksList.results[0]
  //       }
  //     )
  //   )
  // }

  public add(labbook: LabBookPayload): Observable<LabBook> {
    // @ts-ignore
    delete (labbook.projects)
    // @ts-ignore
    delete (labbook.is_template)
    delete (labbook.metadata)
    return this.httpClient.post<LabBook>(this.apiUrl, labbook);
  }


  public get_old(id: string, userId: number, params = new HttpParams()): Observable<PrivilegesData<LabBook>> {
    return of(mockPrivileges).pipe(
      map(privileges => {
        const privilegesData: PrivilegesData<LabBook> = {
          privileges,
          data: mockLabBooksList.results[0]
        };
        return privilegesData;
      })
    )
  }


  public get_without_privileges(id: string, userId: number, params = new HttpParams()): Observable<PrivilegesData<LabBook>> {
    return this.httpClient.get<Lab_Book>(`${this.apiUrl}${id}/`, {params}).pipe(
      switchMap(labBook =>
        of(mockPrivileges).pipe(
          map(privileges => {
            console.log(labBook)
            const privilegesData: PrivilegesData<LabBook> = {
              privileges,
              data: labBook.labbook,
            };
            return privilegesData;
          })
        )
      )
    );
  }


  public get(id: string, userId: number, params = new HttpParams()): Observable<PrivilegesData<LabBook>> {
    return this.httpClient.get<Lab_Book>(`${this.apiUrl}${id}/`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.authguard)),
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


  public patch_old(id: string, labbook: LabBookPayload): Observable<LabBook> {
    let _labbook = <LabBook><unknown>[]
    console.log('Labbook payload ', labbook)
    console.log('payload mock', mockLabBookPayload)
    return this.lab_book_list$.pipe(
      map(() => {
          mockLabBooksList.results.forEach((elem) => {
            if (elem.pk === id) {
              _labbook = elem;
              return
            }
          })
          return _labbook
        }
      )
    )
  }


  public patch(id: string, labbook: LabBookPayload): Observable<LabBook> {
    return this.httpClient.patch<LabBook>(`${this.apiUrl}${id}/`, labbook);
  }


  public restore(id: string): Observable<LabBook> {
    let _labbook = <LabBook><unknown>[]
    return this.lab_book_list$.pipe(
      map(() => {
          mockLabBooksList.results.forEach((elem) => {
            if (elem.pk === id) {
              _labbook = elem;
              return
            }
          })
          return _labbook
        }
      )
    )
  }

  public delete(id: string): Observable<LabBook> {
    let _labbook = <LabBook><unknown>[]
    return this.lab_book_list$.pipe(
      map(() => {
          mockLabBooksList.results.forEach((elem) => {
            if (elem.pk === id) {
              _labbook = elem;
              return
            }
          })
          return _labbook
        }
      )
    )
  }

  public getElements_old(id: string, section?: string): Observable<LabBookElement<any>[]> {
    return this.lab_book_list$.pipe(
      map(() => {
          return [mockLabBookNoteElement]
        }
      )
    )
  }

  public getElements(id: string, section?: string): Observable<LabBookElement<any>[]> {
    if (section) {
      return this.httpClient.get<LabBookElement<any>[]>(`${this.apiUrl}${id}/elements/?section=${section}`).pipe(catchError(err => this.errorservice.handleError(err, this.authguard)));
    }
    return this.httpClient.get<LabBookElement<any>[]>(`${this.apiUrl}${id}/elements/`).pipe(catchError(err => this.errorservice.handleError(err, this.authguard)))
  }


  public getElement(labBookId: string, id: string): Observable<LabBookElement<any>> {
    let _lb_elem = <LabBookElement<any>><unknown>[]
    return this.lab_book_list$.pipe(catchError(err => this.errorservice.handleError(err, this.authguard)),
      map(() => {
          [mockLabBookNoteElement].forEach((elem) => {
            if (elem.labbook_id === labBookId && elem.child_object_id === id) {
              _lb_elem = elem;
              return
            }
          })
          return _lb_elem
        }
      )
    )
  }

  public addElement_old(labBookId: string, element: LabBookElementPayload): Observable<LabBookElement<any>> {
    let _lb_elem = <LabBookElement<any>><unknown>[]
    console.log('Labbook payload as note', element)
    console.log('payload mock', mockNotePayload)
    return this.lab_book_list$.pipe(
      map(() => {
          [mockLabBookNoteElement].forEach((elem) => {
            if (elem.labbook_id === labBookId) {
              _lb_elem = elem;
              return
            }
          })
          return _lb_elem
        }
      )
    )
  }


  public addElement(id: string, element: LabBookElementPayload): Observable<LabBookElement<any>> {
    return this.httpClient.post<LabBookElement<any>>(`${this.apiUrl}${id}/elements/`, element);
  }


  public patchElement(id: string, elementId: string, element: LabBookElementPayload): Observable<LabBookElement<any>> {
    return this.httpClient.patch<LabBookElement<any>>(`${this.apiUrl}${id}/elements/${elementId}/`, element);
  }


  public patchElement_old(labBookId: string, elementId: string, element: LabBookElementPayload): Observable<LabBookElement<any>> {
    let _lb_elem = <LabBookElement<any>><unknown>[]
    console.log('Labbook payload as note', element)
    return this.lab_book_list$.pipe(
      map(() => {
          [mockLabBookNoteElement].forEach((elem) => {
            if (elem.labbook_id === labBookId) {
              _lb_elem = elem;
              return
            }
          })
          return _lb_elem
        }
      )
    )
  }

  public deleteElement_old(id: string, elementId: string): Observable<void> {
    console.log('labook Id ', id)
    console.log('note Id ', elementId)
    return this.lab_book_list$.pipe(
      map(() => {
        }
      )
    )
  }

  public deleteElement(id: string, elementId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}${id}/elements/${elementId}/`);
  }

  public updateAllElements_old(id: string, elements: LabBookElementPayload[]): Observable<string[]> {
    console.log(elements)
    return this.lab_book_list$.pipe(
      map(() => {
          return ['updated']
        }
      )
    )
  }

  public updateAllElements(id: string, elements: LabBookElementPayload[]): Observable<string[]> {
    return this.httpClient.put<string[]>(`${this.apiUrl}${id}/elements/update_all/`, elements);
  }


  public history(id: string): Observable<RecentChanges[]> {
    console.log('history ', id)
    return this.lab_book_list$.pipe(
      map(() => {
          return mockLabBookHistory.results
        }
      )
    )
  }

  public new_history(id: string, params = new HttpParams()): Observable<RecentChanges[]> {
    return this.httpClient.get<DjangoAPI<RecentChanges[]>>(`${this.apiUrl}${id}/history/`, {params}).pipe(map(data => data.results));
  }


  // public versions(id: string): Observable<Version[]> {
  //   return this.lab_book_list$.pipe(
  //     map(() => {
  //         return [mockLabBookVersion]
  //       }
  //     )
  //   )
  // }

  public versions(id: string, params = new HttpParams()): Observable<Version[]> {
    return this.httpClient.get<Version[]>(`${this.apiUrl}${id}/versions/`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.authguard)), map(data => data));
  }


  // // TODO: needs proper interface for return type, maybe with a generic?
  // public previewVersion(id: string, version: string): Observable<any> {
  //   return this.lab_book_list$.pipe(
  //     map(() => {
  //          return mockLabBookVersion.metadata
  //       }
  //     )
  //   )
  // }

  // TODO: needs proper interface for return type, maybe with a generic?
  public previewVersion(id: string, version: string): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}${id}/versions/${version}/preview/`);
  }

  // public old_addVersion(id: string, version?: FinalizeVersion): Observable<LabBook> {
  //   console.log('Finalize Version ', version)
  //   let _labbook = <LabBook><unknown>[]
  //   return this.lab_book_list$.pipe(
  //     map(() => {
  //         mockLabBooksList.results.forEach((elem) => {
  //           if (elem.pk === id) {
  //             _labbook = elem;
  //             return
  //           }
  //         })
  //         return _labbook
  //       }
  //     )
  //   )
  // }


  public addVersion(id: string, version?: FinalizeVersion): Observable<LabBook> {
    return this.httpClient.post<LabBook>(`${this.apiUrl}${id}/versions/`, version);
  }


  public oldrestoreVersion(id: string, version: string, versionInProgress: boolean): Observable<LabBook> {
    console.log()
    return this.lab_book_list$.pipe(
      map(() => {
          return mockLabBook
        }
      )
    )

  }

  public restoreVersion(id: string, version: string, versionInProgress: boolean): Observable<LabBook> {
    // if (versionInProgress) {
    //   return this.addVersion(id).pipe(
    //     switchMap(() => this.httpClient.post<LabBook>(`${this.apiUrl}${id}/versions/${version}/restore/`, {pk: id}))
    //   );
    // }

    return this.httpClient.post<LabBook>(`${this.apiUrl}${id}/versions/${version}/restore/`, {pk: id});
  }


  public lock(id: string): Observable<void> {
    return this.lab_book_list$.pipe(
      map(() => {
          console.log('locked ', id)
        }
      )
    )
  }

  public unlock(id: string): Observable<void> {
    return this.lab_book_list$.pipe(
      map(() => {
          console.log('unlocked ', id)
        }
      )
    )
  }

  public export_old(id: string): Observable<ExportLink> {
    // return this.mockService.export(id)
    return this.lab_book_list$.pipe(
      map(() => {
          return mockExportLink
        }
      )
    )
  }

  public export(id: string): Observable<ExportLink> {
    return this.httpClient.get<ExportLink>(`${this.apiUrl}${id}/get_export_link/`);
  }

  public getRelations(id: string): Observable<{ total: number; data: Relation[] }> {
    return this.lab_book_list$.pipe(
      map(() => {
          return {
            total: mockRelationList.count,
            data: mockRelationList.results
          }
        }
      )
    )
  }

  public addRelation(id: string, payload: RelationPayload): Observable<Relation> {
    console.log('labbook id ', id)
    console.log('relation payload ', payload)
    return this.lab_book_list$.pipe(
      map(() => {
          return mockRelation
        }
      )
    )
  }

  public putRelation(id: string, relationId: string, payload: RelationPutPayload): Observable<Relation> {
    console.log('labbook id ', id)
    console.log('relation payload ', payload)
    console.log('relation id ', relationId)
    return this.lab_book_list$.pipe(
      map(() => {
          return mockRelation
        }
      )
    )
  }

  public deleteRelation(id: string, relationId: string): Observable<void> {
    console.log('labbook id deleted', id)
    console.log('relation id deleted', relationId)
    return this.lab_book_list$.pipe(
      map(() => {
        }
      )
    )
  }

}
