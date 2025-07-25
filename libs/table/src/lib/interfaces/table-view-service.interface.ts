import type { HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';

export interface TableViewService {
  getList: (params: HttpParams, customId?: string) => Observable<{ total: number; data: any[] }>;
}
