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
import {
  CommentsModalComponent
} from '@app/modules/comment/components/modals/comments/comments.component';
import {
  LabBookDrawBoardGridComponent
} from "@app/modules/labbook/components/draw-board/grid/grid.component";
import {
  PictureEditorModalComponent
} from '@app/modules/picture/modals/editor.component';
import {
  // AuthService,
  LabbooksService,
  NotesService,
  PicturesService, UserService,
  WebSocketService
} from '@app/services';
import type {
  LabBookElement,
  Lock,
  Picture,
  PicturePayload,
  Privileges,
  User,
  LabBookElementPayload,
  LabBookElementAddEvent,
} from '@joeseln/types';
import {DialogConfig, DialogRef, DialogService} from '@ngneat/dialog';
import {FormBuilder, FormControl} from '@ngneat/reactive-forms';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {take} from 'rxjs/operators';
import {v4 as uuidv4} from 'uuid';
import {
  admin_element_background_color
} from "@app/modules/labbook/config/admin-element-background-color";


interface ElementRemoval {
  id: string;
  gridReload: boolean;
}

interface FormPicture {
  pic_title: FormControl<string | null>;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-labbook-draw-board-picture',
  templateUrl: './picture.component.html',
  styleUrls: ['./picture.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookDrawBoardPictureComponent implements OnInit {
  @Input()
  public id!: string;

  @Input()
  public element!: LabBookElement<Picture>;

  @Input()
  public section?: string;

  @Input()
  public editable? = false;

  @Input()
  public refreshElementRelations?: EventEmitter<{ model_name: string; model_pk: string }>;

  @Output()
  public removed = new EventEmitter<ElementRemoval>();

  @Output()
  public moved = new EventEmitter<ElementRemoval>();

  @Output()
  public noteToCreate = new EventEmitter<LabBookElementAddEvent>();

  public currentUser: User | null = null;

  public initialState?: Picture;

  public title_editable: Boolean = false

  public privileges: Privileges = {
    fullAccess: false,
    view: false,
    edit: false,
    delete: false,
    trash: false,
    restore: false,
  };

  public lock: Lock | null = null;

  public loading = false;

  public background_color = '';

  public title_id = '';

  public uniqueHash = uuidv4();

  public modalRef?: DialogRef;

  public refreshResetValue = new EventEmitter<boolean>();

  public form = this.fb.group<FormPicture>({
    pic_title: this.fb.control(null, Validators.required),
  });

  public constructor(
    public readonly picturesService: PicturesService,
    private readonly labBooksService: LabbooksService,
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private readonly toastrService: ToastrService,
    // private readonly authService: AuthService,
    private readonly websocketService: WebSocketService,
    private readonly translocoService: TranslocoService,
    private readonly modalService: DialogService,
    public readonly notesService: NotesService,
    private user_service: UserService,
    private readonly drawboardGridComponent: LabBookDrawBoardGridComponent
  ) {
  }

  public get f() {
    return this.form.controls;
  }

  public get lockUser(): { ownUser: boolean; user?: User | undefined | null } {
    if (this.lock) {
      if (this.lock.lock_details?.locked_by.pk === this.currentUser?.pk) {
        return {ownUser: true, user: this.lock.lock_details?.locked_by};
      }

      return {ownUser: false, user: this.lock.lock_details?.locked_by};
    }

    return {ownUser: false, user: null};
  }

  private get picture(): Pick<PicturePayload, 'title'> {
    return {
      title: this.f.pic_title.value!,
    };
  }

  public ngOnInit(): void {
    this.user_service.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
      // console.log(this.currentUser)
    });

    this.initDetails();
    this.initPrivileges();

    if (this.element.child_object.created_by.admin) {
      this.background_color = 'background-color: ' + admin_element_background_color;
    }

    // this.websocketService.subscribe([{
    //   model: 'picture',
    //   pk: this.initialState!.pk
    // }]);

    this.websocketService.elements.pipe(untilDestroyed(this)).subscribe((data: any) => {
      if (data.model_pk === this.initialState!.pk) {
        if (data.model_name === 'comments') {
          this.element.num_related_comments = data['comments_count']
          this.cdr.markForCheck();
          return
        }
        this.picturesService
          .get(this.initialState!.pk)
          .pipe(untilDestroyed(this))
          .subscribe(privilegesData => {
            this.initialState = {...privilegesData.data};
            this.refreshResetValue.next(true);
            this.cdr.markForCheck();

          });
      }
    });
  }

  public initDetails(): void {
    this.form.patchValue(
      {
        pic_title: this.element.child_object.title,
      },
      {emitEvent: false}
    );

    this.initialState = {...this.element.child_object};
    this.title_id = `${this.initialState!.pk}_title_id`;
    // console.log(this.element.child_object.created_by.admin)
  }

  public initPrivileges(): void {
    // if (!this.currentUser?.pk) {
    //   return;
    // }

    this.picturesService
      .get(this.initialState!.pk)
      .pipe(untilDestroyed(this))
      .subscribe(privilegesData => {
        const privileges = privilegesData.privileges;
        this.privileges = {...privileges};
        if (!this.privileges.edit) {
          this.form.disable({emitEvent: false});
        }
        if (this.element.child_object.created_by.admin && this.privileges.restore) {
          this.title_editable = true
        }
        if (!this.element.child_object.created_by.admin && this.privileges.edit) {
          this.title_editable = true
        }
        this.cdr.markForCheck();
      });

    this.cdr.markForCheck();
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.picturesService
      .patch(this.initialState!.pk, this.picture)
      .pipe(untilDestroyed(this))
      .subscribe(
        picture => {
          if (this.lock?.locked && this.lockUser.ownUser) {
            this.picturesService.unlock(this.initialState!.pk);
          }
          this.initialState = {...picture};
          this.form.markAsPristine();
          this.refreshResetValue.next(true);
          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('picture.details.toastr.success')
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

  public pendingChanges(): boolean {
    return this.form.dirty;
  }

  public onRemove(event: ElementRemoval): void {
    this.removed.emit(event);
  }

  public onMove(event: ElementRemoval): void {
    this.moved.emit(event);
  }

  public onOpenCommentsModal(): void {
    this.modalService.open(CommentsModalComponent, {
      closeButton: false,
      width: '912px',
      data: {
        service: this.picturesService,
        element: this.initialState,
        create: true
      },
    });
  }

  public onOpenPictureEditorModal(event: Event): void {
    event.preventDefault();

    if (!this.editable) {
      return;
    }


    this.modalRef = this.modalService.open(PictureEditorModalComponent, {
      closeButton: false,
      width: 'auto',
      data: {
        service: this.picturesService,
        initialState: this.initialState,
        privileges: this.privileges
      },
    } as DialogConfig);

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe(() => this.onModalClose());
  }

  public onModalClose(): void {
    this.picturesService
      .get(this.initialState!.pk)
      .pipe(untilDestroyed(this))
      .subscribe(privilegesData => {
        const picture = privilegesData.data;
        this.element.child_object = {...picture};
        this.initDetails();
        this.cdr.markForCheck();
      });
  }

  public refreshElementRelationsCounter(): void {
    this.labBooksService
      .getElement(this.id, this.element.pk)
      .pipe(untilDestroyed(this))
      .subscribe(element => {
        this.element.num_related_comments = element.num_related_comments!;
        this.element.num_relations = element.num_relations!;
        this.cdr.markForCheck();
      });
  }

  public create_new_note_below(): void {
    this.labBooksService.create_note_below(this.element.pk).pipe(untilDestroyed(this)).subscribe((result) => {
      if (result) {
      } else {
        this.toastrService.warning("Note below could not be created")
      }
    })
  }

  public create_new_note_aside(): void {
    this.labBooksService.create_note_aside(this.element.pk).pipe(untilDestroyed(this)).subscribe((result) => {
      if (result) {
      } else {
        this.toastrService.warning("No enough place to add note")
      }
    })
  }


  public scroll_to_position(pos: number) {
    window.scrollTo({top: pos, behavior: 'smooth'});
  }
}
