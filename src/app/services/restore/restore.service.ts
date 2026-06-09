import {Injectable} from '@angular/core';
import {Subject} from "rxjs";

@Injectable({ providedIn: 'root' })
export class RestoreEventsService {
  private restoredSubject = new Subject<string>(); // child_object_id
  restored$ = this.restoredSubject.asObservable();

  notifyRestored(id: string) {
    this.restoredSubject.next(id);
  }
}

