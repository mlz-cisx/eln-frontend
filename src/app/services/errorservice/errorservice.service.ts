import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {throwError} from 'rxjs';
import {LogoutService} from "@app/services";


@Injectable({
  providedIn: 'root'
})
export class ErrorserviceService {

  constructor() {
  }


  public handleError(error: HttpErrorResponse, auth_guard: LogoutService) {
    if (error.status === 0) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error);
    } else {
      if (error.status == 401) {
        // 401: token expired, unauthorized
        auth_guard.logout()
      }
      if (error.status > 401 && 500 > error.status) {
        // 404: access denied to resource
        auth_guard.redirect_start_page()
      }
    }
    // Return an observable with a user-facing error message.
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }

}
