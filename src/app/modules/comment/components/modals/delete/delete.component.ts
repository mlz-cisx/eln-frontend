import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component
} from '@angular/core';
import {ModalState} from '@app/enums/modal-state.enum';
import {DialogRef} from '@ngneat/dialog';
import {TranslocoService} from '@jsverse/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';

@UntilDestroy()
@Component({
    selector: 'mlzeln-delete-comment-modal',
    templateUrl: './delete.component.html',
    styleUrls: ['./delete.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class DeleteCommentModalComponent {
  public service: any = this.modalRef.data.service;

  public baseModelId: string = this.modalRef.data.baseModelId;

  public relationId: string = this.modalRef.data.relationId;

  public loading = false;

  public state = ModalState.Unchanged;

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService
  ) {
  }

  public onDelete(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.service
      .deleteRelation(this.baseModelId, this.relationId)
      .pipe(untilDestroyed(this))
      .subscribe(
        (msg: string) => {
          if (msg == "nok") {
            this.modalRef.close({state: this.state});
            this.translocoService
            .selectTranslate<string>('comments.deleteModal.toastr.error')
            .pipe(untilDestroyed(this))
            .subscribe(msg => {
              this.toastrService.error(msg);
            });
            return;
          }
          this.state = ModalState.Changed;
          this.modalRef.close({state: this.state});
          // for multiple deletions
          if (!localStorage.getItem('comment_change')) {
            localStorage.setItem('comment_change', String(window.scrollY))
          }

          this.translocoService
            .selectTranslate('comments.deleteModal.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
