import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import type {Note, Relation, User} from '@joeseln/types';
import {DialogRef, DialogService} from '@ngneat/dialog';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {take} from 'rxjs';
import {DeleteCommentModalComponent} from '../modals/delete/delete.component';
import {UserService} from "@app/services";

@UntilDestroy()
@Component({
  selector: 'mlzeln-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentComponent implements OnInit {
  @Input()
  public comment!: Relation<any, Note>;

  @Input()
  public service!: any;

  @Output()
  public refresh = new EventEmitter<boolean>();

  public currentUser: User | null = null;

  public modalRef?: DialogRef;

  public loading = false;

  public constructor(
    private readonly modalService: DialogService,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    private user_service: UserService,
  ) {
  }

  public ngOnInit(): void {
    this.user_service.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });
  }

  public onChangePrivateState(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.comment.private = !this.comment.private;

    this.service
      .putRelation(this.comment.right_object_id, this.comment.pk, this.comment)
      .pipe(untilDestroyed(this))
      .subscribe((result: Relation) => {
        const toastMsg = result.private
          ? this.translocoService.translate('comments.private.toastr.success')
          : this.translocoService.translate('comments.public.toastr.success');

        this.loading = false;
        this.cdr.markForCheck();
        this.toastrService.success(toastMsg);
      });
  }

  public openUserModal(): void {
  }

  public onOpenDeleteModal(): void {
    this.modalRef = this.modalService.open(DeleteCommentModalComponent, {
      closeButton: false,
      data: {
        service: this.service,
        baseModelId: this.comment.right_object_id,
        relationId: this.comment.pk,
      },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe(() => {
      this.refresh.next(true);
    });
  }
}
