import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import type {SearchResult} from '@joeseln/types';
import type {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  public readonly apiUrl = `${environment.apiUrl}/search/`;

  public constructor(private readonly httpClient: HttpClient) {}


  public search(search: string, params = new HttpParams()): Observable<SearchResult[]> {
    const httpParams = params.set('search', search);

    return this.httpClient.get<SearchResult[]>(this.apiUrl, { params: httpParams });
  }
}
