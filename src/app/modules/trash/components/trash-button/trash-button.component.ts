import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import {ModalState} from '@app/enums/modal-state.enum';
import type { TableViewComponent } from '@joeseln/table';
import type {ModalCallback} from '@joeseln/types';
import {DialogConfig, DialogRef, DialogService} from '@ngneat/dialog';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {take} from 'rxjs/operators';
import {DeleteModalComponent} from '../modals/delete/delete.component';

@UntilDestroy()
@Component({
    selector: 'mlzeln-trash-button',
    templateUrl: './trash-button.component.html',
    styleUrls: ['./trash-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class TrashButtonComponent {

  @Input()
  public hoverText: string = '';

  @Input()
  public customId?: string;

  @Input()
  public id!: string;

  @Input()
  public service!: any;

  @Input()
  public tableView?: TableViewComponent;

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
  ) {
  }

  public delete(id: string): void {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.service
      .delete(id, this.customId)
      .pipe(untilDestroyed(this))
      .subscribe(
        (data: any) => {
          if (!data) {
            this.toastrService.error('You are not allowed to perform this action.');
          } else {
            this.tableView?.loadData();
            this.loading = false;
            this.deleted.emit();
            this.translocoService
              .selectTranslate('trashElement.toastr.success')
              .pipe(untilDestroyed(this))
              .subscribe(success => {
                this.toastrService.success(success);
              });
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  public onDelete(id: string): void {


    const skipTrashDialog = true

    if (skipTrashDialog) {
      this.delete(id);
    } else {
      this.modalRef = this.modalService.open(DeleteModalComponent, {
        closeButton: false,
        data: {
          id: this.id,
          service: this.service,
          userSetting: this.skipDialogKey
        },
      } as DialogConfig);

      this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
    }
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.tableView?.loadData();
      this.deleted.emit();
    }
  }
}
