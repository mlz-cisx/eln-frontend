import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {ModalState} from '@app/enums/modal-state.enum';
import {LabbooksService} from '@app/services';
import type { LabBook, ModalCallback } from '@joeseln/types';
import {DialogRef} from '@ngneat/dialog';
import {FormBuilder} from '@ngneat/reactive-forms';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';

@UntilDestroy()
@Component({
  selector: 'mlzeln-labbook-preview',
  templateUrl: './labbook.component.html',
  styleUrls: ['./labbook.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookPreviewComponent implements OnInit {
  @Input()
  public id?: string;

  @Input()
  public version?: string;

  @Input()
  public versionInProgress?: number | null;

  @Input()
  public modalRef!: DialogRef;

  @Output()
  public closed = new EventEmitter<ModalCallback>();

  public state = ModalState.Unchanged;

  public labBook?: LabBook;

  public descriptionFormControl = this.fb.control<string | null>(null);

  public isTemplateFormControl = this.fb.control<boolean>(false);


  public loading = true;

  public constructor(
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly labBooksService: LabbooksService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {
  }

  public ngOnInit(): void {
    // we have to wait a tick to load tiny mce
    setTimeout(() => {
      this.initDetails();

    }, 1)
  }

  public initDetails(): void {
    this.labBooksService
      .previewVersion(this.id!, this.version!)
      .pipe(untilDestroyed(this))
      .subscribe(
        (labBook: LabBook) => {
          this.labBook = {...labBook};

          this.isTemplateFormControl.patchValue(labBook.is_template, {emitEvent: false});
          this.isTemplateFormControl.disable({emitEvent: false});

          this.descriptionFormControl.patchValue(labBook.description, {emitEvent: false});
          this.descriptionFormControl.disable({emitEvent: false});


          this.loading = false;
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }


  private location_reload() {
    location.reload()
  }

  public onRestoreVersion(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.labBooksService
      .restoreVersion(this.id!, this.version!, Boolean(this.versionInProgress))
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.state = ModalState.Changed;
          this.modalRef.close({state: this.state});
          this.translocoService
            .selectTranslate('versions.toastr.success.versionRestored')
            .pipe(untilDestroyed(this))
            .subscribe(versionRestored => {
              this.toastrService.success(versionRestored);
              setTimeout(this.location_reload, 1000)
            })
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
