import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {environment} from '@environments/environment';
import {Observable, of, throwError} from 'rxjs';
import {catchError, map, tap, switchMap} from 'rxjs/operators';
import type {Test} from "@joeseln/types";

@Injectable({
  providedIn: 'root'
})
export class ErrorserviceService {

  constructor() {
  }


  public handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error);
    } else {
      if (error.status > 400 && 500 > error.status) {
        localStorage.clear();
        window.location.reload()
      }
      // The response body may contain clues as to what went wrong.
      console.error(
        `Backend returned code ${error.status}, body was: `, error.error);
    }
    // Return an observable with a user-facing error message.
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
}
