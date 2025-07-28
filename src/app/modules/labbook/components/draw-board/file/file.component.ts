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
  RendererStyleFlags2,
  ElementRef,
  ViewChild,
} from '@angular/core';
import {Validators} from '@angular/forms';
import {
  CommentsModalComponent
} from '@app/modules/comment/components/modals/comments/comments.component';
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
  Privileges,
} from '@joeseln/types';
import {DialogService} from '@ngneat/dialog';
import {FormBuilder, FormControl} from '@ngneat/reactive-forms';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {v4 as uuidv4} from 'uuid';
import {
  admin_element_background_color
} from "@app/modules/labbook/config/admin-element-background-color";
import {environment} from "@environments/environment";


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

  public initialState?: File;

  public privileges?: Privileges;

  public loading = false;

  public submitted = false;

  public toolbar_shown = false;

  public graph_data: any

  public graph_exists = false

  public _graph_exists = false

  public graph_loaded = false;

  public config = {displaylogo: false}

  public editor_loaded = false;

  public preloaded_content: any

  @ViewChild('title')
  private title?: ElementRef;

  @ViewChild('span')
  private span?: ElementRef;

  @ViewChild('preload')
  private preload?: ElementRef;

  public title_id = '';

  public span_id = '';

  public preloaded_id = '';

  public height: any;

  public uniqueHash = uuidv4();

  public background_color = '';

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
    private readonly websocketService: WebSocketService,
    private readonly modalService: DialogService,
    public readonly notesService: NotesService,
    private readonly renderer: Renderer2,
    private readonly elementRef: ElementRef
  ) {
  }

  public get f() {
    return this.form.controls;
  }


  private checkContentSize(): boolean {
    let description_val = this.f.file_description.value ?? '';
    let title_val = this.f.file_title.value ?? '';
    const maxSize = environment.noteMaximumSize ?? 1024; // Default to 1024 KB if not set
    if ((description_val + title_val).length > (maxSize << 10)) {
      this.toastrService.error('Content exceeds the maximum allowed size.');
      return false;
    }
    return true;
  }

  private get file(): Omit<FilePayload, 'name' | 'path'> {
    return {
      title: this.f.file_title.value!,
      description: this.f.file_description.value ?? '',
    };
  }

  public ngOnInit(): void {

    this.initDetails();
    this.initPrivileges();

    if (this.element.child_object.created_by.admin) {
      this.background_color = 'background-color: ' + admin_element_background_color;
    }

    // this.websocketService.subscribe([{
    //   model: 'file',
    //   pk: this.initialState!.pk
    // }]);
  }

  ngAfterViewInit() {

    this.websocketService.elements.pipe(untilDestroyed(this)).subscribe((data: any) => {
      // console.log('file pipe ', data)
      if (data.model_pk === this.initialState!.pk) {
        if (data.model_name === 'comments') {
          this.element.num_related_comments = data['comments_count']
          this.cdr.markForCheck();
          return
        }
        if (!this.submitted) {
          this.filesService
            .get(this.initialState!.pk)
            .pipe(untilDestroyed(this))
            .subscribe(privilegesData => {
              if (this.f.file_description.value != privilegesData.data.description) {
                this.blink();
              }
              this.form.patchValue(
                {
                  file_title: privilegesData.data.title,
                  file_description: privilegesData.data.description,
                },
                {emitEvent: false}
              );
              this.preloaded_content = privilegesData.data.description
              if (this.preload) {
                  this.renderer.setProperty(this.preload.nativeElement, 'innerHTML', this.preloaded_content);
              }

            });
        }
        this.submitted = false
      }
    });

    if (this.preload) {
      this.renderer.setProperty(this.preload.nativeElement, 'innerHTML', this.preloaded_content);
    }

    const descriptionElement = this.elementRef.nativeElement.querySelector(`#description-${this.uniqueHash}`);
    if (descriptionElement) {
      const observer = new ResizeObserver(
        entries => {
          for (const entry of entries) {
            const container = this.elementRef.nativeElement.querySelector(`#description-${this.uniqueHash}`);
            if (container) {
              const elements = container.getElementsByClassName('tox-tinymce');
              if (elements[0]) {
                this.renderer.setStyle(elements[0], 'height', `${entry.contentRect.height - 100}px`, RendererStyleFlags2.Important);
              }
            }
          }
        }
      );
      observer.observe(descriptionElement);
    }
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
    this.span_id = `${this.initialState!.pk}_span_id`;


    this.filesService
      .get(this.initialState!.pk)
      .pipe(untilDestroyed(this))
      .subscribe(privilegesData => {
        const privileges = privilegesData.privileges;
        this.privileges = {...privileges};
        if (!this.privileges.edit) {
          this.form.disable({emitEvent: false});
        }
        this.convertPlotData(privilegesData.data);
        // TODO think about this
        this.graph_exists = this._graph_exists
        this.cdr.markForCheck();
      });
  }

  public convertPlotData(data: File): void {
     try {
      if (JSON.parse(data.plot_data).length > 0) {
        let loc_graph_data: any = []
        JSON.parse(data.plot_data).forEach((plot: any) => {
          const new_data = [];
          for (const [key, value] of Object.entries(plot[1])) {
            new_data.push(
              {
                y: Object.values(value as JSON),
                mode: 'lines+markers',
                name: key
              }
            )
          }
          // title: plot[0] graph: plot [1]
          let layout = {
            title: {text: plot[0]}
          }
          loc_graph_data.push([layout, new_data])
        })
        this.graph_data = loc_graph_data
        this._graph_exists = true
      }
    } catch (e) {
      console.log(e)
    }
  }


  public onSubmit(): void {
    if (!this.checkContentSize()) {
      return;
    }

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
          if (file) {
            // this.initialState = {...file};
            this.form.markAsPristine();

            this.loading = false;
            this.cdr.markForCheck();
            // this.translocoService
            //   .selectTranslate('file.details.toastr.success')
            //   .pipe(untilDestroyed(this))
            //   .subscribe(success => {
            //     this.toastrService.success(success);
            //   });
            this.preloaded_content = file.description
            if (this.preload) {
              this.renderer.setProperty(this.preload.nativeElement, 'innerHTML', this.preloaded_content);
            }

          } else {
            this.toastrService.error('Description size exceeded.');
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

  public toggle_toolbar(): void {
    if (this.toolbar_shown) {
      this.toolbar_shown = false;
      this.cdr.detectChanges()
    } else {
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

}
