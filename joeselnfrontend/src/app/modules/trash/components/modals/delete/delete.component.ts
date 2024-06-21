/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component
} from '@angular/core';
import {ModalState} from '@app/enums/modal-state.enum';
import {DialogRef} from '@ngneat/dialog';
import {FormBuilder} from '@ngneat/reactive-forms';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {switchMap, take} from 'rxjs/operators';

interface FormDelete {
  doNotShowMessageAgain: boolean;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-delete-modal',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteModalComponent {
  public service: any = this.modalRef.data.service;

  public id?: string = this.modalRef.data.id;

  public userSetting?: string = this.modalRef.data.userSetting;

  public loading = false;

  public state = ModalState.Unchanged;

  public form = this.fb.group<FormDelete>({
    doNotShowMessageAgain: false,
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly fb: FormBuilder,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef
  ) {
  }

  public get f() {
    return this.form.controls;
  }

  public get isProject(): boolean {
    return true
  }

  public onSubmit(): void {
    if (this.loading || !this.service?.delete) {
      return;
    }
    this.loading = true;

    this.service
      .delete(this.id)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.state = ModalState.Changed;
          this.modalRef.close({state: this.state});
          this.translocoService
            .selectTranslate('trash.deleteModal.toastr.success.elementTrashed')
            .pipe(untilDestroyed(this))
            .subscribe(elementTrashed => {
              this.toastrService.success(elementTrashed);
            });
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public saveUserDialogSettings(): void {
  }
}
