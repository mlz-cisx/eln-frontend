/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */


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
import {CommentsService, UserService} from '@app/services';
import {LogoutService} from '@app/services';
import type {CommentPayload, User} from '@joeseln/types';
import {FormBuilder, FormControl} from '@ngneat/reactive-forms';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {v4 as uuidv4} from 'uuid';


interface FormComment {
  content: FormControl<string | null>;
  private: boolean | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-create-comment',
  templateUrl: './create-comment.component.html',
  styleUrls: ['./create-comment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  public projects: any;

  public form = this.fb.group<FormComment>({
    content: this.fb.control(null, Validators.required),
    private: false,
  });

  public constructor(
    private readonly commentsService: CommentsService,
    private readonly fb: FormBuilder,
    private readonly authService: LogoutService,
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
      private: this.f.private.value ?? false,
    };
  }


  public ngOnInit(): void {
    this.user_service.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
      // console.log(this.currentUser)
    });
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.commentsService
      .add(this.comment)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          // page is blocked if you reset here
          // this.form.reset();
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
