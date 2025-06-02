/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */


import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  Renderer2,
  RendererStyleFlags2
} from '@angular/core';
import {Validators} from '@angular/forms';
import {
  CommentsModalComponent
} from '@app/modules/comment/components/modals/comments/comments.component';
import {
  LabbooksService,
  NotesService,
  UserService,
  WebSocketService
} from '@app/services';
import type {
  LabBookElement,
  Note,
  NotePayload,
  Privileges,
  LabBookElementPayload,
} from '@joeseln/types';
import {DialogService} from '@ngneat/dialog';
import {FormBuilder, FormControl} from '@ngneat/reactive-forms';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {v4 as uuidv4} from 'uuid';
import {environment} from '@environments/environment';
import {
  admin_element_background_color
} from "@app/modules/labbook/config/admin-element-background-color";


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
  public editable? = false;

  public initialState?: Note;

  public privileges?: Privileges;

  public loading = false;

  public toolbar_shown = false;

  public editor_loaded = false;

  public preloaded_content: any

  public preloaded_id = '';

  public title_id = '';

  public span_id = '';

  public height: any;


  public background_color = '';

  public enlarge_rows_id = '';

  public uniqueHash = uuidv4();

  public submitted = false;

  public form = this.fb.group<FormNote>({
    note_subject: this.fb.control(null, Validators.required),
    note_content: null,
  });

  public constructor(
    public readonly notesService: NotesService,
    private readonly labBooksService: LabbooksService,
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private readonly toastrService: ToastrService,
    // private readonly authService: AuthService,
    private readonly websocketService: WebSocketService,
    private readonly translocoService: TranslocoService,
    private readonly modalService: DialogService,
    private readonly renderer: Renderer2
  ) {
  }

  public get f() {
    return this.form.controls;
  }


  private get note(): NotePayload {
    return {
      subject: this.f.note_subject.value!,
      content: this.f.note_content.value ?? '',
    };
  }

  public ngOnInit(): void {

    this.initDetails();
    this.initPrivileges();
    if (this.element.child_object.created_by.admin) {
      this.background_color = 'background-color: ' + admin_element_background_color;
    }


    // this.websocketService.subscribe([{
    //   model: 'note',
    //   pk: this.initialState!.pk
    // }]);


  }

  ngAfterViewInit() {
    
    this.websocketService.elements.pipe(untilDestroyed(this)).subscribe((data: any) => {
      if (data.model_pk === this.initialState!.pk) {
        if (data.model_name === 'comments') {
          this.element.num_related_comments = data['comments_count']
          this.cdr.markForCheck();
          return
        }
        if (!this.submitted) {
          this.blink()
          this.notesService
            .get(this.initialState!.pk)
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

              const preloadedElement = document.getElementById(this.preloaded_id);
              if (preloadedElement) {
                this.renderer.setProperty(preloadedElement, 'innerHTML', this.preloaded_content);
              }

            });
        }
        this.submitted = false
      }
    });
    
    if (document.getElementById(this.preloaded_id)) {
      // @ts-ignore
      document.getElementById(this.preloaded_id).innerHTML = this.preloaded_content
    }

    const obj = document.getElementById('content-' + this.uniqueHash) as HTMLDivElement
    const observer = new ResizeObserver(
      entries => {
        for (const entry of entries) {
          const container = document.getElementById('content-' + this.uniqueHash);
          if (container) {
            const elements = container.getElementsByClassName('tox-tinymce');
            // Check if the nth element exists
            if (elements[0]) {
              this.renderer.setStyle(elements[0], 'height', `${entry.contentRect.height}px`, RendererStyleFlags2.Important);
            }
          }
        }
      })
    observer.observe(obj)
  }

  public initDetails(): void {
    this.height = Math.max((this.element.height - 2) * 36, 100)
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

    this.enlarge_rows_id = `${this.initialState!.pk}_rows_id`;
    this.preloaded_id = `${this.initialState!.pk}_preloaded_id`;
    this.title_id = `${this.initialState!.pk}_title_id`;
    this.span_id = `${this.initialState!.pk}_span_id`;


    this.notesService
      .get(this.initialState!.pk)
      .pipe(untilDestroyed(this))
      .subscribe(privilegesData => {
        const privileges = privilegesData.privileges;
        this.privileges = {...privileges};
        if (!this.privileges.edit) {
          this.form.disable({emitEvent: false});

        }
        this.cdr.markForCheck();
        // restore old note content
        // this.toggle_toolbar();
        // this.toggle_toolbar();
      });
  }


  private checkContentSize(): boolean {
    const content = this.f.note_content.value ?? '';
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

    this.submitted = true;

    this.loading = true;
    this.notesService
      .patch(this.initialState!.pk, this.note)
      .pipe()
      .subscribe(
        note => {
          if (note) {

            this.initialState = {...note};
            this.form.markAsPristine();
            this.loading = false;
            this.cdr.markForCheck();
            this.translocoService
              .selectTranslate('note.details.toastr.success')
              .pipe(untilDestroyed(this))
              .subscribe(success => {
                // this.toastrService.success(success);
                this.preloaded_content = note.content;
                const preloadedElement = document.getElementById(this.preloaded_id);
                if (preloadedElement) {
                  this.renderer.setProperty(preloadedElement, 'innerHTML', this.preloaded_content);
                }
              });
          } else {
            this.toastrService.error('Note size exceeded.');
            setTimeout(() => location.reload(), 2000);
          }
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }


  public onOpenCommentsModal(): void {

    this.modalService.open(CommentsModalComponent, {
      closeButton: false,
      width: '800px',
      data: {
        service: this.notesService,
        element: this.initialState,
        create: true,
        labbook_pk: this.element.labbook_id
      },
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


  public blink() {
    const obj = document.getElementById(this.span_id) as HTMLElement
    obj.style.visibility = 'visible'
    let counter = 0
    let timerId = setInterval(function () {
      if (counter % 2 == 0) {
        obj.style.visibility = 'hidden'
        counter++
      } else {
        obj.style.visibility = 'visible'
        counter++
      }
    }, 500)

    setTimeout(() => {
      {
        obj.style.visibility = 'hidden'
        clearInterval(timerId);
      }
    }, 5000);
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

  public toggle_editor(): void {
    if (this.privileges?.edit) {
      const title = document.getElementById(this.title_id);
      if (title && !this.editor_loaded) {
        this.renderer.setStyle(title, 'border', '');
      }
      this.editor_loaded = !this.editor_loaded; // Toggle state
      this.cdr.detectChanges();
    }
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
