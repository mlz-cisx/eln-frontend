import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import type { ModalCallback, Version } from '@joeseln/types';
import { DialogRef } from '@ngneat/dialog';
import { TranslocoService } from '@jsverse/transloco';

@Component({
    selector: 'mlzeln-version-preview-modal',
    templateUrl: './preview.component.html',
    styleUrls: ['./preview.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class VersionPreviewModalComponent {
  public contentType: string = this.modalRef.data?.contentType ?? '';

  public version: Version = this.modalRef.data?.version;

  public versionNumber?: number = this.modalRef.data?.versionNumber;

  public versionInProgress?: number = this.modalRef.data?.versionInProgress;

  @Output()
  public closed = new EventEmitter<ModalCallback>();

  public constructor(public readonly modalRef: DialogRef, public readonly translocoService: TranslocoService) {}

  public onModalClose(callback: ModalCallback): void {
    this.closed.emit(callback);
  }
}
