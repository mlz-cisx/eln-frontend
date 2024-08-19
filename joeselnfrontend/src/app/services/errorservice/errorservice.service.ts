import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {AuthGuardService} from "@app/services";


@Injectable({
  providedIn: 'root'
})
export class ErrorserviceService {

  constructor(private authguard: AuthGuardService) {
  }


  public handleError(error: HttpErrorResponse, auth_guard: AuthGuardService) {
    if (error.status === 0) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error);
    } else {
      if (error.status > 400 && 500 > error.status) {
        auth_guard.redirect_start_page()
      }
      // The response body may contain clues as to what went wrong.
      console.error(
        `Backend returned code ${error.status}, body was: `, error.error);
    }
    // Return an observable with a user-facing error message.
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }

}
