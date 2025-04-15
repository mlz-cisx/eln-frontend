import type {HttpParams} from '@angular/common/http';
import type {Observable} from 'rxjs';
import type {Version, FinalizeVersion} from './version.interface';

export interface VersionsService<T> {
  versions: (id: string, params?: HttpParams) => Observable<Version[]>;
  previewVersion: (id: string, version: string) => Observable<any>;
  addVersion: (id: string, version?: FinalizeVersion) => Observable<T>;
  restoreVersion: (id: string, version: string, versionInProgress: boolean) => Observable<T>;
}
