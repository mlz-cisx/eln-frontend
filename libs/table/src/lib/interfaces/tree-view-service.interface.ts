import type { HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';

export interface TreeViewService {
  getList: (params?: HttpParams) => Observable<{ total: number; data: any[] }>;
  getChildrenOf: (childrenOf: string, params: HttpParams) => Observable<{ total: number; data: any[] }>;
}
