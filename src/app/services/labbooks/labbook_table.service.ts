import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import {LabbookchildelementTableView} from "@joeseln/types";
import {catchError, map} from 'rxjs/operators';
import {Observable} from "rxjs";
import {ErrorserviceService, LogoutService} from "@app/services";


@Injectable({
  providedIn: 'root'
})
export class LabbookTableService {

  public readonly apiUrl = `${environment.apiUrl}/labbooks/`;


  constructor(private readonly httpClient: HttpClient,
              private readonly errorservice: ErrorserviceService,
              private logout: LogoutService
  ) {
  }

  public getList(labbook_id: string, params = new HttpParams()): Observable<{ total: number; data: LabbookchildelementTableView[] }> {
    return this.httpClient.get<LabbookchildelementTableView[]>(`${this.apiUrl}${labbook_id}/elements_table/`, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)),
      map(data => ({
        total: data.length,
        data: data,
      }))
    );
  }


}
