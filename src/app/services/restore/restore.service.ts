import {Injectable} from '@angular/core';
import {Subject} from "rxjs";

@Injectable({ providedIn: 'root' })
export class RestoreEventsService {
  private restoredSubject = new Subject<string>(); // child_object_id
  private thrashedSubject = new Subject<string>();   // child_object_id
  restored$ = this.restoredSubject.asObservable();
  thrashed$ = this.thrashedSubject.asObservable();

  notifyRestored(id: string) {
    this.restoredSubject.next(id);
  }
    notifyThrashed(id: string) {
    this.thrashedSubject.next(id);
  }
}

