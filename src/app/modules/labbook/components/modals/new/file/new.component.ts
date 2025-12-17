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
import {FilesService, LabbooksService} from '@app/services';
import type {
  DropdownElement,
  FilePayload,
  ModalCallback,
} from '@joeseln/types';
import {LabBookElementPayload} from "@joeseln/types";
import {DialogRef} from '@ngneat/dialog';
import {FormBuilder, FormControl} from '@ngneat/reactive-forms';
import {TranslocoService} from '@jsverse/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {environment} from "@environments/environment";
import {takeUntil} from "rxjs/operators";
import {Subject} from "rxjs";

type NonNegativeInteger = number & { __nonNegativeIntegerBrand: never };

interface FormElement {
  parentElement: FormControl<string | null>;
  position: FormControl<'top' | 'bottom' | NonNegativeInteger>;
  title: FormControl<string | null>;
  name: string | null;
  file: FormControl<globalThis.File | string | null>;
  description: string | null;
}

@UntilDestroy()
@Component({
  selector: 'mlzeln-new-labbook-file-element-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class NewLabBookFileElementModalComponent implements OnInit {
  @Output()
  public closed = new EventEmitter<ModalCallback>();

  public labBookId = this.modalRef.data.labBookId;

  public position_option = this.modalRef.data.position;

  public loading = true;

  public step = 1;

  public lb_elements_count = 0

  public state = ModalState.Unchanged;

  public parentElement: DropdownElement[] = [];

  public position: DropdownElement[] = [];

  public form = this.fb.group<FormElement>({
    parentElement: this.fb.control('labBook', Validators.required),
    position: this.fb.control(<'top' | 'bottom' | NonNegativeInteger>('bottom')),
    title: this.fb.control(null, Validators.required),
    name: null,
    file: this.fb.control(null, Validators.required),
    description: null,
  });

  public filePlaceholder = this.translocoService.translate('file.newModal.file.placeholder');
  private unsubscribe$ = new Subject<void>();

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

  ngAfterViewInit(): void {
    if (
      this.position_option !== null && this.position_option !== undefined &&
      !this.position.some(opt => opt.value === this.position_option)
    ) {
      this.position = [
        ...this.position,
        {value: this.position_option, label: this.position_option.toString()}
      ];
      this.form.patchValue({position: this.position_option});
      this.cdr.detectChanges();
    }
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
            this.createElement(50, file.pk)
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

  public asNonNegativeInteger(n: number): NonNegativeInteger {
    if (!Number.isInteger(n) || n < 0) {
      throw new Error("Value must be an integer ≥ 0");
    }
    return n as NonNegativeInteger;
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

  public addNumberTag = (userInput: string) => {
    const num = Number(userInput);
    if (Number.isInteger(num) && num >= 0) {
      return {value: this.asNonNegativeInteger(num), label: userInput};
    }
    return null;
  };

  private createElement(child_object_content_type: number, child_object_id: string, width: number = 10, height: number = 10) {
    if (!this.labBookId) return;
    const elem: LabBookElementPayload = {
      child_object_content_type: child_object_content_type,
      child_object_id: child_object_id,
      width: width,
      height: height,
      position: this.element.position
    }
    this.labBooksService.addElementToRow(this.labBookId, elem).subscribe(() => {
      this.modalRef.close();
      this.translocoService
        .selectTranslate('labBook.newFileElementModal.toastr.success')
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe((success: string) => {
          this.toastrService.success(success);
        });
    });
  }

  isNumeric(value: any): boolean {
    return typeof value === 'number';
  }
}
