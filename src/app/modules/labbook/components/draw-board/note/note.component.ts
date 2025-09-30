import {
  afterEveryRender,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  Renderer2,
  RendererStyleFlags2,
  ViewChild,
} from '@angular/core';
import {Validators} from '@angular/forms';
import {
  CommentsModalComponent
} from '@app/modules/comment/components/modals/comments/comments.component';
import { LabbooksService, NotesService, WebSocketService } from '@app/services';
import type {
  LabBookElement,
  Note,
  NotePayload,
  Privileges,
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
    selector: 'mlzeln-labbook-draw-board-note',
    templateUrl: './note.component.html',
    styleUrls: ['./note.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
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

  @ViewChild('title')
  private title?: ElementRef;

  @ViewChild('span')
  private span?: ElementRef;

  @ViewChild('preload')
  private preload?: ElementRef;

  public uniqueHash = uuidv4();

  public submitted = false;

  @ViewChild('content', { static: false })
  contentContainer?: ElementRef;

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
    private readonly websocketService: WebSocketService,
    private readonly translocoService: TranslocoService,
    private readonly modalService: DialogService,
    private readonly renderer: Renderer2,
  ) {
    afterEveryRender(() => {
      if (this.contentContainer) {
        const elements = this.contentContainer.nativeElement.getElementsByClassName('tox-tinymce');
        if (elements[0]) {
          this.renderer.setStyle(
            elements[0],
            'height',
            `${this.contentContainer.nativeElement.clientHeight - 20}px`, RendererStyleFlags2.Important);
        }
      };
    });
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
          this.notesService
            .get(this.initialState!.pk)
            .pipe(untilDestroyed(this))
            .subscribe(privilegesData => {
              if (this.f.note_content.value != privilegesData.data.content) {
                this.blink();
              }
              this.form.patchValue(
                {
                  note_subject: privilegesData.data.subject,
                  note_content: privilegesData.data.content,
                },
                {emitEvent: false}
              );
              this.preloaded_content = privilegesData.data.content

              if (this.preload) {
                // this.renderer.setProperty(this.preload.nativeElement, 'innerHTML', this.preloaded_content);
              }

            });
        }
        this.submitted = false
      }
    });

    if (this.preload) {
      // this.renderer.setProperty(this.preload.nativeElement, 'innerHTML', this.preloaded_content);
    }
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
                if (this.preload) {
                  // this.renderer.setProperty(this.preload.nativeElement, 'innerHTML', this.preloaded_content);
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

  public blink() {

    const blinkInterval = 500;
    const blinkDuration = 5000;
    const blinkCount = blinkDuration / blinkInterval;

    let counter = 0;
    const blink = setInterval(() => {

      if (!this.span) {
        clearInterval(blink);
        return;
      }

      this.renderer.setStyle(
        this.span.nativeElement,
        'visibility',
        counter % 2 === 0 ? 'hidden' : 'visible'
      );
      counter++;

    // Stop after totalDuration
    if (counter >= blinkCount) {
      this.renderer.setStyle(this.span.nativeElement, 'visibility', 'hidden');
      clearInterval(blink);
    }
    }, blinkInterval);
  }

  public scroll_to_position(pos: number) {
    window.scrollTo({top: pos, behavior: 'smooth'});
  }

  public refreshElementRelationsCounter(): void {
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
      if (this.title && !this.editor_loaded) {
        this.renderer.setStyle(this.title.nativeElement, 'border', '');
      }
      this.editor_loaded = !this.editor_loaded; // Toggle state
      this.cdr.detectChanges();
    }
  }


  public reload() {
  }
}
