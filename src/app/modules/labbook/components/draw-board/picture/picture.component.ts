import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import {Validators} from '@angular/forms';
import {
  CommentsModalComponent
} from '@app/modules/comment/components/modals/comments/comments.component';
import {
  PictureEditorModalComponent
} from '@app/modules/picture/modals/editor.component';
import {
  LabbooksService,
  NotesService,
  PicturesService,
  WebSocketService
} from '@app/services';
import type {
  LabBookElement,
  Picture,
  PicturePayload,
  Privileges,
} from '@joeseln/types';
import {DialogConfig, DialogRef, DialogService} from '@ngneat/dialog';
import {FormBuilder, FormControl} from '@ngneat/reactive-forms';
import {TranslocoService} from '@jsverse/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {take} from 'rxjs/operators';
import {v4 as uuidv4} from 'uuid';
import {
  admin_element_background_color
} from "@app/modules/labbook/config/admin-element-background-color";


interface FormPicture {
  pic_title: FormControl<string | null>;
}

@UntilDestroy()
@Component({
    selector: 'mlzeln-labbook-draw-board-picture',
    templateUrl: './picture.component.html',
    styleUrls: ['./picture.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
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

  public loading = false;

  public background_color = '';

  public title_id = '';

  public uniqueHash = uuidv4();

  public modalRef?: DialogRef;

  public form = this.fb.group<FormPicture>({
    pic_title: this.fb.control(null, Validators.required),
  });

  public constructor(
    public readonly picturesService: PicturesService,
    private readonly labBooksService: LabbooksService,
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private readonly toastrService: ToastrService,
    private readonly websocketService: WebSocketService,
    private readonly translocoService: TranslocoService,
    private readonly modalService: DialogService,
    public readonly notesService: NotesService,
  ) {
  }

  public get f() {
    return this.form.controls;
  }

  private get picture(): Pick<PicturePayload, 'title'> {
    return {
      title: this.f.pic_title.value!,
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
        this.picturesService
          .get(this.initialState!.pk)
          .pipe(untilDestroyed(this))
          .subscribe(privilegesData => {
            this.initialState = {...privilegesData.data};
            this.form.patchValue(
              {
                pic_title: privilegesData.data.title,
              },
              {emitEvent: false}
            );
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
  }

  public initPrivileges(): void {

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
          this.initialState = {...picture};
          this.form.markAsPristine();
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
