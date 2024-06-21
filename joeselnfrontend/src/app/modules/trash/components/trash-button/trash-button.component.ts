/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import type { TableViewComponent, TreeViewComponent } from '@joeseln/table';
import type { ModalCallback } from '@joeseln/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs/operators';
import { DeleteModalComponent } from '../modals/delete/delete.component';

@UntilDestroy()
@Component({
  selector: 'eworkbench-trash-button',
  templateUrl: './trash-button.component.html',
  styleUrls: ['./trash-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrashButtonComponent {
  @Input()
  public id!: string;

  @Input()
  public service!: any;

  @Input()
  public tableView?: TableViewComponent | TreeViewComponent;

  @Input()
  public loading = false;

  @Input()
  public skipDialogKey = 'SkipDialog-Trash';

  @Output()
  public deleted = new EventEmitter<void>();

  public modalRef?: DialogRef;

  public constructor(
    private readonly modalService: DialogService,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService
  ) {}

  public delete(id: string): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.service
      .delete(id)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.tableView?.loadData();
          this.loading = false;
          this.deleted.emit();
          this.translocoService
            .selectTranslate('trashElement.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
        },
        () => {
          this.loading = false;
        }
      );
  }

  public onDelete(id: string): void {
    // for now deleting here is not possible
    return

    // const skipTrashDialog = true
    //
    // if (skipTrashDialog) {
    //   this.delete(id);
    // } else {
    //   this.modalRef = this.modalService.open(DeleteModalComponent, {
    //     closeButton: false,
    //     data: { id: this.id, service: this.service, userSetting: this.skipDialogKey },
    //   });
    //
    //   this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
    // }
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.tableView?.loadData();
      this.deleted.emit();
    }
  }
}
