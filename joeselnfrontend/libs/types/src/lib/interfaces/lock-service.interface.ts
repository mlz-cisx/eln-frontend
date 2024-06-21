import type {HttpParams} from '@angular/common/http';
import type {Observable} from 'rxjs';

export interface LockService {
  lock: (id: string, params?: HttpParams) => Observable<void>;
  unlock: (id: string, params?: HttpParams) => Observable<void>;
}
