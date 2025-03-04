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
  //AuthService,
  FilesService,
  LabbooksService, NotesService, UserService,
  WebSocketService
} from '@app/services';
import type {
  File,
  FilePayload,
  LabBookElement,
  Lock,
  Privileges,
  User,
  LabBookElementPayload
} from '@joeseln/types';
import {DialogService} from '@ngneat/dialog';
import {FormBuilder, FormControl} from '@ngneat/reactive-forms';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {v4 as uuidv4} from 'uuid';

interface ElementRemoval {
  id: string;
  gridReload: boolean;
}

interface FormFile {
  file_title: FormControl<string | null>;
  file_description: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-labbook-draw-board-file',
  templateUrl: './file.component.html',
  styleUrls: ['./file.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookDrawBoardFileComponent implements OnInit {
  @Input()
  public id!: string;

  @Input()
  public element!: LabBookElement<File>;

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

  public currentUser: User | null = null;

  public initialState?: File;

  public privileges?: Privileges;

  public lock: Lock | null = null;

  public loading = false;

  public submitted = false;

  public toolbar_shown = false;

  public title_id = '';

  public editor_loaded = false;

  public preloaded_content: any

  public preloaded_id = '';

  public height: any;

  public uniqueHash = uuidv4();

  public background_color = '';

  public refreshResetValue = new EventEmitter<boolean>();

  public form = this.fb.group<FormFile>({
    file_title: this.fb.control(null, Validators.required),
    file_description: null,
  });

  public constructor(
    public readonly filesService: FilesService,
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

  private get file(): Omit<FilePayload, 'name' | 'path'> {
    return {
      title: this.f.file_title.value!,
      description: this.f.file_description.value ?? '',
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
      this.background_color = 'background-color: #fff4c2';
    }

    // this.websocketService.subscribe([{
    //   model: 'file',
    //   pk: this.initialState!.pk
    // }]);

    this.websocketService.elements.pipe(untilDestroyed(this)).subscribe((data: any) => {
      // console.log('file pipe ', data)
      if (data.model_pk === this.initialState!.pk) {
        if (!this.submitted) {
          this.filesService
            .get(this.initialState!.pk)
            .pipe(untilDestroyed(this))
            .subscribe(privilegesData => {
              this.form.patchValue(
                {
                  file_title: privilegesData.data.title,
                  file_description: privilegesData.data.description,
                },
                {emitEvent: false}
              );
              this.preloaded_content = privilegesData.data.description
              if (document.getElementById(this.preloaded_id)) {
                // @ts-ignore
                document.getElementById(this.preloaded_id).innerHTML = this.preloaded_content
              }

            });
        }
        this.submitted = false
      }
    });

    this.refreshElementRelations?.subscribe((event: { model_name: string; model_pk: string }) => {
      if (event.model_name === 'file' && event.model_pk === this.initialState!.pk) {
        this.refreshElementRelationsCounter();
      }
    });
  }

  ngAfterViewInit() {
    if (document.getElementById(this.preloaded_id)) {
      // @ts-ignore
      document.getElementById(this.preloaded_id).innerHTML = this.preloaded_content
    }

    var obj = document.getElementById('description-' + this.uniqueHash) as HTMLDivElement
    const observer = new ResizeObserver(
      entries => {
        for (const entry of entries) {
          const container = document.getElementById('description-' + this.uniqueHash);
          if (container) {
            const elements = container.getElementsByClassName('tox-tinymce');
            // Check if the nth element exists
            if (elements[0]) {
              const elem = elements[0] as HTMLElement
              elem.setAttribute("style", "height:" + (entry.contentRect.height - 100) + "px !important")
            }
          }
        }
      })
    observer.observe(obj)
  }

  public initDetails(): void {
    this.height = Math.max((this.element.height - 5) * 36, 100)
    this.form.patchValue(
      {
        file_title: this.element.child_object.title,
        file_description: this.element.child_object.description,
      },
      {emitEvent: false}
    );
    this.preloaded_content = this.element.child_object.description
    this.initialState = {...this.element.child_object};
  }

  public initPrivileges(): void {
    this.preloaded_id = `${this.initialState!.pk}_preloaded_id`;
    this.title_id = `${this.initialState!.pk}_title_id`;

    // if (!this.currentUser?.pk) {
    //   return;
    // }


    this.filesService
      .get(this.initialState!.pk)
      .pipe(untilDestroyed(this))
      .subscribe(privilegesData => {
        const privileges = privilegesData.privileges;
        this.privileges = {...privileges};
        if (!this.privileges.edit) {
          this.form.disable({emitEvent: false});
        }
        // TODO think about this
        this.cdr.markForCheck();
      });
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.submitted = true;

    this.filesService
      .patch(this.initialState!.pk, this.file)
      .pipe(untilDestroyed(this))
      .subscribe(
        file => {
          if (this.lock?.locked && this.lockUser.ownUser) {
            this.filesService.unlock(this.initialState!.pk);
          }

          // this.initialState = {...file};
          this.form.markAsPristine();
          this.refreshResetValue.next(true);

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('file.details.toastr.success')
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
        service: this.filesService,
        element: this.initialState,
        create: true
      },
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
    var bodyRect = 0
    if (document.body.getBoundingClientRect()) {
      bodyRect = -document.body.getBoundingClientRect().y
    } else {
      bodyRect = (this.element.position_y + this.element.height) * 36
    }

    const new_note = {
      subject: this.translocoService.translate('labBook.newNoteElementModal.subject.placeholder'),
      content: '<p></p>',
    };
    this.notesService.add(new_note).pipe(untilDestroyed(this)).subscribe(
      note => {

        const element: LabBookElementPayload = {
          child_object_content_type: 30,
          child_object_content_type_model: 'shared_elements.note',
          child_object_id: note.pk,
          position_x: 0,
          // +1 makes it working after restructure
          position_y: this.element.position_y + 1,
          width: 13,
          height: 7,
        };
        this.labBooksService.addElement(this.element.labbook_id, element).pipe(untilDestroyed(this)).subscribe(
          () => {
            localStorage.setItem('pageVerticalposition', String(bodyRect))
            localStorage.setItem('note_inserted', String(1))
            location.reload()
          }
        );
      }
    )
  }

  public scroll_to_position(pos: number) {
    window.scrollTo({top: pos, behavior: 'smooth'});
  }

  public toggle_toolbar(): void {
    if (this.toolbar_shown) {
      this.toolbar_shown = false;
      this.cdr.detectChanges()
    } else {
      this.toolbar_shown = true;
      this.cdr.detectChanges()
    }
  }

  public load_editor(): void {
    const title = document.getElementById(this.title_id)
    // @ts-ignore
    if (title) {
      title.style.border = ''
    }
    this.editor_loaded = true;
    this.cdr.detectChanges()
  }

}
