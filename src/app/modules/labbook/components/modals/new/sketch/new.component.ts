import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import {Validators} from '@angular/forms';
import {ModalState} from '@app/enums/modal-state.enum';
import { LabbooksService, PicturesService } from '@app/services';
import type {SaveSketchEvent} from '@joeseln/picture-editor';
import type {
  DropdownElement,
  LabBookElementEvent,
  ModalCallback,
  SketchPayload,
} from '@joeseln/types';
import {DialogRef} from '@ngneat/dialog';
import {FormBuilder, FormControl} from '@ngneat/reactive-forms';
import {TranslocoService} from '@jsverse/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';

interface FormElement {
  parentElement: FormControl<string | null>;
  position: FormControl<'top' | 'bottom'>;
  title: FormControl<string | null>;
  height: number | null;
  width: number | null;
  rendered_image: globalThis.File | Blob | string | null;
  shapes_image: globalThis.File | Blob | string | null;
}

@UntilDestroy()
@Component({
    selector: 'mlzeln-new-labbook-sketch-modal',
    templateUrl: './new.component.html',
    styleUrls: ['./new.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class NewLabBookSketchModalComponent implements OnInit {
  @Output()
  public closed = new EventEmitter<ModalCallback>();

  public labBookId = this.modalRef.data.labBookId;


  public loading = true;

  public step = 1;

  public state = ModalState.Unchanged;

  public parentElement: DropdownElement[] = [];

  public position: DropdownElement[] = [];


  public form = this.fb.group<FormElement>({
    parentElement: this.fb.control('labBook', Validators.required),
    position: this.fb.control('top', Validators.required),
    title: this.fb.control(null, Validators.required),
    height: null,
    width: null,
    rendered_image: null,
    shapes_image: null,
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly labBooksService: LabbooksService,
    private readonly picturesService: PicturesService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
  ) {
  }

  public get f() {
    return this.form.controls;
  }

  public get element(): any {
    const element = {
      parentElement: this.f.parentElement.value,
      position: this.f.position.value,
    };

    return element;
  }

  public get picture(): SketchPayload {
    return {
      title: this.f.title.value!,
      height: 600,
      width: 600,
      rendered_image: this.f.rendered_image.value!,
      shapes_image: this.f.shapes_image.value,
    };
  }

  public ngOnInit(): void {
    this.initTranslations();
    this.initSearchInput();
    //this.initDetails();
    this.parentElement = [...this.parentElement];
    this.loading = false;
    this.cdr.markForCheck();
    this.patchFormValues();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('labBook.newPictureElementModal')
      .pipe(untilDestroyed(this))
      .subscribe(newPictureElementModal => {
        this.parentElement = [{value: 'labBook', label: newPictureElementModal.currentLabBook}];

        this.position = [
          {value: 'top', label: newPictureElementModal.position.top},
          {value: 'bottom', label: newPictureElementModal.position.bottom},
        ];
      });
  }

  public initSearchInput(): void {

  }

  public initDetails(): void {
    this.labBooksService
      .getElements(this.labBookId)
      .pipe(untilDestroyed(this))
      .subscribe(
        labBookElements => {
          const sections: DropdownElement[] = [];

          labBookElements.map(element => {
            if (element.child_object_content_type_model === 'labbooks.labbooksection') {
              sections.push({
                value: element.child_object.pk,
                label: `${element.child_object.date as string}: ${element.child_object.title as string}`,
              });
            }
          });

          this.parentElement = [...this.parentElement, ...sections];
          this.loading = false;
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public patchFormValues(): void {


  }

  public onSubmit(event: SaveSketchEvent): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.form.patchValue({
      rendered_image: event.file,
      shapes_image: event.shapes,
    });

    this.picturesService
      .add(this.picture)
      .pipe(untilDestroyed(this))
      .subscribe(
        picture => {
          if (picture) {
            this.state = ModalState.Changed;
            const event: LabBookElementEvent = {
              childObjectId: picture.pk,
              childObjectContentType: picture.content_type,
              childObjectContentTypeModel: picture.content_type_model,
              parentElement: this.element.parentElement,
              position: this.element.position,
            };
            this.modalRef.close({state: this.state, data: event});
            this.translocoService
              .selectTranslate('labBook.newSketchModal.toastr.success')
              .pipe(untilDestroyed(this))
              .subscribe(success => {
                this.toastrService.success(success);
              });
          }
          else {
            this.toastrService.error('File Size exceeded.');
          }
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onChangeStep(step: number): void {
    this.step = step;
  }


  public create_new_sketch(): void {
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
        title: 'SketchToEdit.png',
        height: 600,
        width: 600,
        rendered_image: new Blob(['example.png'], {type: "text/html"}),
        shapes_image: null,
      };

      this.picturesService
        .add(new_sketch)
        .pipe(untilDestroyed(this))
        .subscribe(
          picture => {
            this.state = ModalState.Changed;
            const event: LabBookElementEvent = {
              childObjectId: picture.pk,
              childObjectContentType: picture.content_type,
              childObjectContentTypeModel: picture.content_type_model,
              parentElement: this.element.parentElement,
              position: this.element.position,
            };
            this.modalRef.close({state: this.state, data: event});
            this.translocoService
              .selectTranslate('labBook.newSketchModal.toastr.success')
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
      // delete the internal blob reference, to let the browser clear memory from it
      URL.revokeObjectURL(link.href);
    }, 'image/png');
  }
}
