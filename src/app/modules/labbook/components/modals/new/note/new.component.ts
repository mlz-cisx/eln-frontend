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
import {LabbooksService, NotesService} from '@app/services';
import type {DropdownElement, ModalCallback, NotePayload} from '@joeseln/types';
import {LabBookElementPayload} from "@joeseln/types";
import {DialogRef} from '@ngneat/dialog';
import {FormBuilder, FormControl} from '@ngneat/reactive-forms';
import {TranslocoService} from '@jsverse/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {takeUntil} from "rxjs/operators";
import {Subject} from "rxjs";

type NonNegativeInteger = number & { __nonNegativeIntegerBrand: never };

interface FormElement {
  parentElement: FormControl<string | null>;
  position: FormControl<'top' | 'bottom' | NonNegativeInteger>;
}

@UntilDestroy()
@Component({
  selector: 'mlzeln-new-labbook-note-element-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class NewLabBookNoteElementModalComponent implements OnInit {
  @Output()
  public closed = new EventEmitter<ModalCallback>();

  public labBookId = this.modalRef.data.labBookId;

  public position_option = this.modalRef.data.position;

  public form = this.fb.group<FormElement>({
    parentElement: this.fb.control('labBook', Validators.required),
    position: this.fb.control(<'top' | 'bottom' | NonNegativeInteger>('bottom')),
  });

  public loading = true;

  public state = ModalState.Unchanged;

  public parentElement: DropdownElement[] = [];

  public position: DropdownElement[] = [];

  private unsubscribe$ = new Subject<void>();

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly notesService: NotesService,
    private readonly labBooksService: LabbooksService,
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

  public get note(): NotePayload {
    const note = {
      subject: this.translocoService.translate('labBook.newNoteElementModal.subject.placeholder'),
      content: '<p></p>',
    };

    return note;
  }

  public ngOnInit(): void {
    this.initTranslations();
    this.parentElement = [...this.parentElement];
    this.loading = false;
    this.cdr.markForCheck();
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
    console.log('init translations')
    this.translocoService
      .selectTranslateObject('labBook.newNoteElementModal')
      .pipe(untilDestroyed(this))
      .subscribe(newNoteElementModal => {
        this.parentElement = [{
          value: 'labBook',
          label: newNoteElementModal.currentLabBook
        }];

        this.position = [
          {value: 'top', label: newNoteElementModal.position.top},
          {value: 'bottom', label: newNoteElementModal.position.bottom},
        ];
      });
  }


  public onSubmitWithPosition(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.notesService
      .add(this.note)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        note => {
          if (note) {
            this.state = ModalState.Changed;
            this.createElement(30, note.pk)
          } else {
            this.toastrService.error('Note Size exceeded.');
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
        .selectTranslate('labBook.newNoteElementModal.toastr.success')
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
