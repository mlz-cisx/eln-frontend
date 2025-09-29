import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DialogRef } from '@ngneat/dialog';

@Component({
    selector: 'mlzeln-pending-changes-modal',
    templateUrl: './pending-changes.component.html',
    styleUrls: ['./pending-changes.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class PendingChangesModalComponent {
  public constructor(public readonly modalRef: DialogRef) {}
}
