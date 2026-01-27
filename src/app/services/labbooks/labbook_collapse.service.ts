import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LabbookCollapseService {
  private _collapsed$ = new BehaviorSubject<boolean>(true);

  public collapsed$ = this._collapsed$.asObservable();

  setCollapsed(value: boolean) {
    this._collapsed$.next(value);
  }

  expand() {
    this._collapsed$.next(false);
  }

  collapse() {
    this._collapsed$.next(true);
  }

  toggle() {
    this._collapsed$.next(!this._collapsed$.value);
  }
}
