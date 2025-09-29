import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import {Validators} from '@angular/forms';
import {ModalState} from '@app/enums/modal-state.enum';
import {LabbooksService} from '@joeseln/services';
import type { LabBook } from '@joeseln/types';
import {DialogRef} from '@ngneat/dialog';
import {FormBuilder, FormControl} from '@ngneat/reactive-forms';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';

interface FormLabBook {
  title: FormControl<string | null>;
  isTemplate: boolean;
  description: string | null;
}

@UntilDestroy()
@Component({
    selector: 'mlzeln-new-labbook-modal',
    templateUrl: './new.component.html',
    styleUrls: ['./new.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class NewLabBookModalComponent implements OnInit {
  public initialState?: LabBook = this.modalRef.data?.initialState;

  public withSidebar?: boolean = this.modalRef.data?.withSidebar;

  public duplicate?: string = this.modalRef.data?.duplicate;

  public loading = false;

  public state = ModalState.Unchanged;


  public form = this.fb.group<FormLabBook>({
    title: this.fb.control(null, Validators.required),
    isTemplate: false,
    description: null,
  });

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly labBooksService: LabbooksService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService
  ) {
  }

  public get f() {
    return this.form.controls;
  }

  public get labBook(): any {
    return {
      title: this.f.title.value,
      is_template: this.f.isTemplate.value,
      description: this.f.description.value ?? '',
    };
  }

  public ngOnInit(): void {
    this.initSearchInput();
    this.patchFormValues();
  }

  public initSearchInput(): void {

  }

  public patchFormValues(): void {
    if (this.initialState) {
      this.form.patchValue(
        {
          title: this.initialState.title,
          isTemplate: this.initialState.is_template,
          description: this.initialState.description,
        },
        {emitEvent: false}
      );

    }
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.labBooksService
      .add(this.labBook)
      .pipe(untilDestroyed(this))
      .subscribe(
        labBook => {
          this.state = ModalState.Changed;
          if (labBook) {
            this.modalRef.close({
              state: this.state,
              data: {newContent: labBook},
              navigate: [`${this.withSidebar ? '..' : ''}/labbooks`, labBook.pk],
            });
            this.translocoService
              .selectTranslate('labBook.newModal.toastr.success')
              .pipe(untilDestroyed(this))
              .subscribe(success => {
                this.toastrService.success(success);
              });
          } else {
            this.toastrService.error('Labbook could not be created');
            this.modalRef.close();
          }
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
