import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import type {Observable} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {environment} from '@environments/environment';
import { Stat } from '@joeseln/types';
import {LogoutService, ErrorserviceService} from "@app/services";

@Injectable({
  providedIn: 'root',
})
export class StatService {

  public readonly apiUrl = `${environment.apiUrl}/stat/`;

  constructor(private readonly httpClient: HttpClient,
              private readonly errorservice: ErrorserviceService,
              private logout: LogoutService) {
  }

  public get(): Observable<Stat> {
    return this.httpClient.get<Stat>(this.apiUrl).pipe(catchError(err => this.errorservice.handleError(err, this.logout)))
  }
}
