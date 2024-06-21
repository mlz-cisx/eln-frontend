import type {HttpParams} from '@angular/common/http';
import type {Observable} from 'rxjs';
import type {RecentChanges} from './recent-changes.interface';

export interface RecentChangesService {
  history: (id: string, params?: HttpParams) => Observable<RecentChanges[]>;
}
