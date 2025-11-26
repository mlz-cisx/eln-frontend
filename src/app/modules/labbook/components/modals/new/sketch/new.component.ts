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
import {LabbooksService, PicturesService} from '@app/services';
import type {
  DropdownElement,
  LabBookElementEvent,
  ModalCallback,
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
    return {
      parentElement: this.f.parentElement.value,
      position: this.f.position.value,
    };
  }


  public ngOnInit(): void {
    this.initTranslations();
    this.parentElement = [...this.parentElement];
    this.loading = false;
    this.cdr.markForCheck();
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



  public create_new_sketch(): void {
    const new_sketch = {
      title: 'NewSketch',
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


  }

}
