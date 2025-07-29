import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DialogRef } from '@ngneat/dialog';

@Component({
  selector: 'mlzeln-recent-changes-modal',
  templateUrl: './recent-changes.component.html',
  styleUrls: ['./recent-changes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentChangesModalComponent {
  public id: string = this.modalRef.data.id;

  public service: any = this.modalRef.data.service;

  public constructor(public readonly modalRef: DialogRef) {}
}
