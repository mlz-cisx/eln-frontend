import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import type {Comment, CommentPayload} from '@joeseln/types';
import type {Observable} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {ErrorserviceService, LogoutService} from "@app/services";

@Injectable({
  providedIn: 'root',
})
export class CommentsService {
  public readonly apiUrl = `${environment.apiUrl}/comments/`;

  public constructor(private readonly httpClient: HttpClient,
                     private readonly errorservice: ErrorserviceService,
                     private logout: LogoutService) {
  }

  public add(comment: CommentPayload, params = new HttpParams()): Observable<Comment> {
    return this.httpClient.post<Comment>(this.apiUrl, comment, {params}).pipe(catchError(err => this.errorservice.handleError(err, this.logout)), map(data => data));
  }

}
