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
import {PicturesService} from '@app/services';
import type { ModalCallback, Picture } from '@joeseln/types';
import {DialogRef} from '@ngneat/dialog';
import {FormBuilder} from '@ngneat/reactive-forms';
import {TranslocoService} from '@jsverse/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';

@UntilDestroy()
@Component({
    selector: 'mlzeln-picture-preview',
    templateUrl: './picture.component.html',
    styleUrls: ['./picture.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class PicturePreviewComponent implements OnInit {
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

  public picture?: Picture;



  public loading = true;

  public constructor(
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly picturesService: PicturesService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {
  }

  public ngOnInit(): void {
    this.initDetails();
  }

  public initDetails(): void {
    this.picturesService
      .previewVersion(this.id!, this.version!)
      .pipe(untilDestroyed(this))
      .subscribe(
        (picture: Picture) => {
          this.picture = {...picture};
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

    this.picturesService
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
