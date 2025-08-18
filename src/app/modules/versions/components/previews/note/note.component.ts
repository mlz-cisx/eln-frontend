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
import {NotesService} from '@app/services';
import type { ModalCallback, Note } from '@joeseln/types';
import {DialogRef} from '@ngneat/dialog';
import {FormBuilder} from '@ngneat/reactive-forms';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';

@UntilDestroy()
@Component({
  selector: 'mlzeln-note-preview',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotePreviewComponent implements OnInit {
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

  public note?: Note;

  public contentFormControl = this.fb.control<string | null>(null);



  public loading = true;

  public constructor(
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly notesService: NotesService,
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
    this.notesService
      .previewVersion(this.id!, this.version!)
      .pipe(untilDestroyed(this))
      .subscribe(
        (note: Note) => {
          this.note = {...note};

          this.contentFormControl.patchValue(note.content, {emitEvent: false});
          this.contentFormControl.disable({emitEvent: false});


          this.loading = false;
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }


  public onRestoreVersion(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.notesService
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
              this.cdr.markForCheck()
              this.cdr.detectChanges()
            });
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
