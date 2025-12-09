import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {Validators} from '@angular/forms';
import {ModalState} from '@app/enums/modal-state.enum';
import { CommentsService, LogoutService, UserService } from '@app/services';
import type {CommentPayload, User} from '@joeseln/types';
import {FormBuilder, FormControl} from '@ngneat/reactive-forms';
import {TranslocoService} from '@jsverse/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {v4 as uuidv4} from 'uuid';
import {environment} from "@environments/environment";


interface FormComment {
  content: FormControl<string | null>;
  private: boolean | null;
}

@UntilDestroy()
@Component({
    selector: 'mlzeln-create-comment',
    templateUrl: './create-comment.component.html',
    styleUrls: ['./create-comment.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class CreateCommentComponent implements OnInit {
  @Input()
  public id!: string;

  @Input()
  public contentType!: number;

  @Input()
  public service!: any;

  @Output()
  public refresh = new EventEmitter<boolean>();

  public currentUser: User | null = null;

  public loading = false;

  public uniqueHash = uuidv4();

  public state = ModalState.Unchanged;


  public form = this.fb.group<FormComment>({
    content: this.fb.control(null, Validators.required),
    private: false,
  });

  public constructor(
    private readonly commentsService: CommentsService,
    private readonly fb: FormBuilder,
    private readonly logoutService: LogoutService,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    private user_service: UserService,
  ) {
  }

  public get f() {
    return this.form.controls;
  }

  public get comment(): CommentPayload {
    return {
      content: this.f.content.value ?? '',
      relates_to_content_type_id: this.contentType,
      relates_to_pk: this.id,
    };
  }


  public ngOnInit(): void {
    this.user_service.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });
  }

  private checkContentSize(): boolean {
    const content = this.comment.content ?? '';
    const maxSize = environment.noteMaximumSize ?? 1024; // Default to 1024 KB if not set
    if (content.length > (maxSize << 10)) {
      this.toastrService.error('Content exceeds the maximum allowed size.');
      return false;
    }
    return true;
  }


  public onSubmit(): void {
    if (!this.checkContentSize()) {
      return;
    }
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.commentsService
      .add(this.comment)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.form.markAsPristine();
          this.loading = false;
          this.refresh.next(true);
          this.translocoService
            .selectTranslate('comments.newCommentModal.toastr.success')
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
