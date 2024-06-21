import type {HttpParams} from '@angular/common/http';
import type {Observable} from 'rxjs';
import type {ExportLink} from './export-link.interface';

export interface ExportService {
  export: (id: string, params?: HttpParams) => Observable<ExportLink>;
}
