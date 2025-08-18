import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output
} from '@angular/core';
import {Validators} from '@angular/forms';
import {ModalState} from '@app/enums/modal-state.enum';
import { FilesService, LabbooksService } from '@app/services';
import type {
  DropdownElement,
  FilePayload,
  LabBookElementEvent,
  ModalCallback,
} from '@joeseln/types';
import {DialogRef} from '@ngneat/dialog';
import {FormBuilder, FormControl} from '@ngneat/reactive-forms';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {environment} from "@environments/environment";

interface FormElement {
  parentElement: FormControl<string | null>;
  position: FormControl<'top' | 'bottom'>;
  title: FormControl<string | null>;
  name: string | null;
  file: FormControl<globalThis.File | string | null>;
  storage: string | null;
  description: string | null;
}

@UntilDestroy()
@Component({
  selector: 'mlzeln-new-labbook-file-element-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewLabBookFileElementModalComponent implements OnInit {
  @Output()
  public closed = new EventEmitter<ModalCallback>();

  public labBookId = this.modalRef.data.labBookId;


  public loading = true;

  public step = 1;

  public lb_elements_count = 0

  public state = ModalState.Unchanged;

  public parentElement: DropdownElement[] = [];

  public position: DropdownElement[] = [];


  public filePlaceholder = this.translocoService.translate('file.newModal.file.placeholder');

  public form = this.fb.group<FormElement>({
    parentElement: this.fb.control('labBook', Validators.required),
    position: this.fb.control('bottom', Validators.required),
    title: this.fb.control(null, Validators.required),
    name: null,
    file: this.fb.control(null, Validators.required),
    storage: null,
    description: null,
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly labBooksService: LabbooksService,
    private readonly filesService: FilesService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService
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

  public get file(): FilePayload {
    return {
      title: this.f.title.value!,
      name: this.f.name.value!,
      path: this.f.file.value!,
      directory_id: this.f.storage.value ?? undefined!,
      description: this.f.description.value ?? '',
      labbook_pk: this.labBookId
    };
  }

  public ngOnInit(): void {
    this.initTranslations();
    this.initSearchInput();
    this.initDetails();
    this.parentElement = [...this.parentElement];
    this.loading = false;
    this.cdr.markForCheck();
    this.patchFormValues();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('labBook.newFileElementModal')
      .pipe(untilDestroyed(this))
      .subscribe(newFileElementModal => {
        this.parentElement = [{
          value: 'labBook',
          label: newFileElementModal.currentLabBook
        }];

        this.position = [
          {value: 'top', label: newFileElementModal.position.top},
          {value: 'bottom', label: newFileElementModal.position.bottom},
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
          // const sections: DropdownElement[] = [];

          this.lb_elements_count = labBookElements.length


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

  public onUpload(event: Event): void {
    const files = (event.target as HTMLInputElement).files;

    if (files?.length) {
      const reader = new FileReader();
      reader.onload = () => {
        this.filePlaceholder = files[0].name;
        this.form.patchValue({name: files[0].name, file: files[0]});
        this.f.file.markAsDirty();
        this.cdr.markForCheck();
      };
      reader.readAsBinaryString(files[0]);
    }
  }

  private checkContentSize(): boolean {
    const maxSize = environment.noteMaximumSize ?? 1024; // Default to 1024 KB if not set
    if (Object(this.file.path).size > (maxSize << 10) ||
      Object(this.file.description).length > (maxSize << 10)) {
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
    this.loading = true;

    this.filesService
      .add(this.file)
      .pipe(untilDestroyed(this))
      .subscribe(
        file => {
          if (file) {
            this.state = ModalState.Changed;
            const event: LabBookElementEvent = {
              childObjectId: file.pk,
              childObjectContentType: file.content_type,
              childObjectContentTypeModel: file.content_type_model,
              parentElement: this.element.parentElement,
              position: this.element.position,
            };
            this.modalRef.close({state: this.state, data: event});
            this.translocoService
              .selectTranslate('labBook.newFileElementModal.toastr.success')
              .pipe(untilDestroyed(this))
              .subscribe(success => {
                this.toastrService.success(success);
              });
            if (this.file.name.endsWith('spc') &&  this.lb_elements_count > 0) {
              this.toastrService.warning('Plots from a .spc cannot be created on non-empty labbooks')
            }
          } else {
            this.toastrService.error('File Size exceeded.');
          }
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );

  }

  public createTree(items: any[], id = null, level = 0): any[] {
    return items.filter(dir => dir.directory === id).map(d => ({
      ...d,
      level,
      children: this.createTree(items, d.pk, level + 1)
    }));
  }

  public flattenTree(items: any[], res: any[] = []): any[] {
    if (items.length === 0) return res;
    const top = items.shift();
    if (!top) return res;
    res.push(top);
    if (top.children?.length) {
      res = this.flattenTree(top.children, res);
    }
    return this.flattenTree(items, res);
  }

  public onChangeStep(step: number): void {
    this.step = step;
  }
}
