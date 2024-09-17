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
//  AuthService,
  LabbooksService,
  NotesService,
  PicturesService,
  WebSocketService
} from '@app/services';
import type {
  LabBookElement,
  Lock,
  Note,
  NotePayload,
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
import {debounceTime, skip} from "rxjs/operators";


interface ElementRemoval {
  id: string;
  gridReload: boolean;
}

interface FormNote {
  note_subject: FormControl<string | null>;
  note_content: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-labbook-draw-board-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookDrawBoardNoteComponent implements OnInit {
  @Input()
  public id!: string;

  @Input()
  public element!: LabBookElement<Note>;

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

  public initialState?: Note;

  public privileges?: Privileges;

  public lock: Lock | null = null;

  public loading = false;

  public toolbar_shown = false;

  public editor_loaded = false;

  public preloaded_content: any

  public preloaded_id = '';

  public title_id = '';

  public display_toolbar_button = true;

  public background_color = '';

  public enlarge_rows_id = '';

  public uniqueHash = uuidv4();

  public refreshResetValue = new EventEmitter<boolean>();

  public submitted = false;

  public form = this.fb.group<FormNote>({
    note_subject: this.fb.control(null, Validators.required),
    note_content: null,
  });

  public constructor(
    public readonly notesService: NotesService,
    private readonly labBooksService: LabbooksService,
    private readonly picturesService: PicturesService,
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private readonly toastrService: ToastrService,
    // private readonly authService: AuthService,
    private readonly websocketService: WebSocketService,
    private readonly translocoService: TranslocoService,
    private readonly modalService: DialogService,
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

  private get note(): NotePayload {
    return {
      subject: this.f.note_subject.value!,
      content: this.f.note_content.value ?? '',
    };
  }

  public ngOnInit(): void {

    // this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
    //   this.currentUser = state.user;
    // });


    this.initDetails();
    this.initPrivileges();
    if (this.element.child_object.created_by.username === 'admin') {
      this.background_color = 'background-color: #fff4c2';
      this.display_toolbar_button = false;
    }


    this.websocketService.subscribe([{
      model: 'note',
      pk: this.initialState!.pk
    }]);

    this.websocketService.elements.pipe(untilDestroyed(this)).subscribe((data: any) => {
      // console.log('note pipe ', data)
      if (data.model_pk === this.initialState!.pk) {
        if (!this.submitted) {
          this.notesService
            .get(this.initialState!.pk, 123)
            .pipe(untilDestroyed(this))
            .subscribe(privilegesData => {
              this.form.patchValue(
                {
                  note_subject: privilegesData.data.subject,
                  note_content: privilegesData.data.content,
                },
                {emitEvent: false}
              );
              this.preloaded_content = privilegesData.data.content
              // @ts-ignore
              document.getElementById(this.preloaded_id).innerHTML = this.preloaded_content
            });
        }
        this.submitted = false
      }

    });

    this.refreshElementRelations?.subscribe((event: { model_name: string; model_pk: string }) => {
      if (event.model_name === 'note' && event.model_pk === this.initialState!.pk) {
        this.refreshElementRelationsCounter();
      }
    });
  }

  ngAfterViewInit() {
    if (document.getElementById(this.preloaded_id)) {
      // @ts-ignore
      document.getElementById(this.preloaded_id).innerHTML = this.preloaded_content
    }
  }

  public initDetails(): void {
    this.form.patchValue(
      {
        note_subject: this.element.child_object.subject,
        note_content: this.element.child_object.content,
      },
      {emitEvent: false}
    );
    this.preloaded_content = this.element.child_object.content
    this.initialState = {...this.element.child_object};
  }


  public initPrivileges(): void {
    // if (!this.currentUser?.pk) {
    //   return;
    // }

    this.enlarge_rows_id = `${this.initialState!.pk}_rows_id`;
    this.preloaded_id = `${this.initialState!.pk}_preloaded_id`;
    this.title_id = `${this.initialState!.pk}_title_id`;


    this.notesService
      .get(this.initialState!.pk, 123)
      .pipe(untilDestroyed(this))
      .subscribe(privilegesData => {
        const privileges = privilegesData.privileges;
        this.privileges = {...privileges};
        if (!this.privileges.edit) {
          this.form.disable({emitEvent: false});
        }
        // this.cdr.markForCheck();
        // restore old note content
        // this.toggle_toolbar();
        // this.toggle_toolbar();
      });
  }


  public onSubmit(): void {
    if (this.loading) {
      return;
    }

    this.submitted = true;

    this.loading = true;
    this.notesService
      .patch(this.initialState!.pk, this.note)
      .pipe()
      .subscribe(
        note => {
          // if (this.lock?.locked && this.lockUser.ownUser) {
          //   this.notesService.unlock(this.initialState!.pk);
          // }
          this.initialState = {...note};
          this.form.markAsPristine();
          this.refreshResetValue.next(true);
          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('note.details.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              // this.toastrService.success(success);
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
      width: '800px',
      data: {
        service: this.notesService,
        element: this.initialState,
        create: true
      },
    });
  }

  // public create_new_note_below(): void {
  //   this.labBooksService
  //     .getList(new HttpParams())
  //     .pipe(untilDestroyed(this))
  //     .subscribe(data => {
  //       data.data.forEach(elem => {
  //           if (elem.pk === this.element.lab_book_id) {
  //             const new_note = {
  //               subject: this.translocoService.translate('labBook.newNoteElementModal.subject.placeholder'),
  //               content: '<p></p>',
  //             };
  //             this.notesService.add(new_note).pipe(untilDestroyed(this)).subscribe(
  //               note => {
  //
  //                 const element: LabBookElementPayload = {
  //                   child_object_content_type: 42,
  //                   child_object_id: note.pk,
  //                   position_x: 0,
  //                   position_y: this.element.position_y + this.element.height,
  //                   width: 13,
  //                   height: 7,
  //                 };
  //                 this.labBooksService.addElement(this.element.lab_book_id, element).pipe(untilDestroyed(this)).subscribe(
  //                   () => {
  //                     this.drawboardGridComponent.reload();
  //
  //                     setTimeout(() => this.scroll_to_position((this.element.position_y + this.element.height) * 36), 3000);
  //                   }
  //                 );
  //               }
  //             )
  //           }
  //         }
  //       )
  //     });
  // }

  public create_new_note_below(): void {
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
          position_y: this.element.position_y + this.element.height,
          width: 13,
          height: 7,
        };
        this.labBooksService.addElement(this.element.labbook_id, element).pipe(untilDestroyed(this)).subscribe(
          () => {
            localStorage.setItem('pageVerticalposition', String((this.element.position_y + this.element.height) * 36))
            localStorage.setItem('note_inserted', String(1))
            this.drawboardGridComponent.reload_given_drawboard()
          }
        );
      }
    )
  }

  public create_new_note_aside(): void {
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
          position_x: this.element.width,
          position_y: this.element.position_y,
          width: 20 - this.element.width,
          height: this.element.height,
        };
        this.labBooksService.addElement(this.element.labbook_id, element).pipe(untilDestroyed(this)).subscribe(
          () => {
            localStorage.setItem('pageVerticalposition', String((this.element.position_y) * 36))
            localStorage.setItem('note_inserted', String(1))
            this.drawboardGridComponent.reload_given_drawboard()
          }
        );
      }
    )
  }

  public enlarge_note(): void {
    let rows = 10
    // @ts-ignore
    if (document.getElementById(this.enlarge_rows_id).value) {
      // @ts-ignore
      rows = Number(document.getElementById(this.enlarge_rows_id).value)
      if (rows > 100 || rows < 1) {
        rows = 10;
      }
    }
    const element: LabBookElementPayload = {
      position_x: this.element.position_x,
      position_y: this.element.position_y,
      width: this.element.width,
      child_object_id: this.element.child_object_id,
      child_object_content_type: this.element.child_object_content_type,
      height: this.element.height + rows,
    };
    this.labBooksService.patchElement(this.element.labbook_id, this.element.pk, element).pipe(untilDestroyed(this)).subscribe(
      () => {
        setTimeout(() => this.scroll_to_position((this.element.position_y + this.element.height) * 36), 3000);
      }
    );
  }

  public create_new_sketch_below(): void {

    const canvas = document.createElement('canvas');

    canvas.toBlob((blob) => {
      // blob ready, download it
      const link = document.createElement('a');
      link.download = 'example.png';

      // @ts-ignore
      link.href = URL.createObjectURL(blob);
      // should not appear as download
      // link.click();

      const new_sketch = {
        title: 'SketchToEdit',
        height: 600,
        width: 600,
        rendered_image: new Blob(['example.png'], {type: "text/html"}),
        shapes_image: null,
      };

      this.picturesService.add(new_sketch).pipe(untilDestroyed(this)).subscribe(
        pic => {
          const element: LabBookElementPayload = {
            child_object_content_type: 40,
            child_object_content_type_model: 'pictures.picture',
            child_object_id: pic.pk,
            position_x: 0,
            position_y: this.element.position_y + this.element.height,
            width: 13,
            height: 7,
          };
          this.labBooksService.addElement(this.element.labbook_id, element).pipe(untilDestroyed(this)).subscribe(
            () => {
              setTimeout(() => this.scroll_to_position((this.element.position_y + this.element.height) * 36), 3000);
            }
          );
        }
      )
      // delete the internal blob reference, to let the browser clear memory from it
      URL.revokeObjectURL(link.href);
    }, 'image/png');


  }


  public scroll_to_position(pos: number) {
    window.scrollTo({top: pos, behavior: 'smooth'});
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

  public toggle_toolbar(): void {
    if (this.editor_loaded && this.toolbar_shown) {
      this.toolbar_shown = false;
      this.cdr.detectChanges()
    } else if (this.editor_loaded && !this.toolbar_shown) {
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


  public reload() {
    this.labBooksService
      .getElement(this.id, this.element.pk)
      .pipe(untilDestroyed(this))
      .subscribe(element => {
        this.form.patchValue(
          {
            note_subject: element.child_object.subject,
            note_content: element.child_object.content,
          },
          {emitEvent: false}
        );
      });
  }
}
