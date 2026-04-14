import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnDestroy,
  Output
} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {UntilDestroy, untilDestroyed} from "@ngneat/until-destroy";
import {lastValueFrom, delay} from "rxjs";
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Subject} from "rxjs";
import {DialogRef} from "@ngneat/dialog";
import {LabBookExport} from '@joeseln/types';
import {environment} from '@environments/environment';
import {LabbooksService} from '@app/services';
import {TranslocoService} from '@jsverse/transloco';
import {ToastrService} from 'ngx-toastr';

export type ContainType = 30 | 40 | 50 | 70;

export interface ExportFilter {
  containTypes: ContainType[];
  startTime: Date | null;
  endTime: Date | null;
}

@UntilDestroy()
@Component({
  selector: 'mlzeln-export-select-modal',
  templateUrl: './export-select.component.html',
  styleUrls: ['./export-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class ExportSelectModalComponent implements OnDestroy {

  private id: string = this.modalRef.data.id;

  private title: string = this.modalRef.data.title;

  private service: LabbooksService = this.modalRef.data.service;

  // eslint-disable-next-line
  public exportType: 'pdf' | 'zip' = this.modalRef.data.exportType;

  public loading: boolean = false;

  @Output() apply = new EventEmitter<ExportFilter>();

  readonly containTypeLabels: Record<ContainType, string> = {
    30: 'Notes',
    40: 'Sketches',
    50: 'Files',
    70: 'Comments'
  };
  readonly containTypeOptions: ContainType[] = [30, 40, 50, 70];
  form: FormGroup = this.fb.group({
    containTypes: [[70]],
    startTime: [null],
    endTime: [null],
  });
  private unsubscribe$ = new Subject<void>();

  constructor(private fb: FormBuilder,
              public readonly modalRef: DialogRef,
              private readonly httpClient: HttpClient,
              private readonly translocoService: TranslocoService,
              private readonly toastrService: ToastrService
  ) {
  }

  get isUnfiltered(): boolean {
    const v = this.form.value;
    const effectiveTypes = (v.containTypes || []).filter((t: number) => t !== 70);

    const noTypes = effectiveTypes.length === 0;
    const noDates = !v.startTime && !v.endTime;

    return noTypes && noDates;
  }

  get isOnlyComments(): boolean {
    const types = this.form.value.containTypes || [];
    return types.length === 1 && types[0] === 70;
  }

  ngOnInit(): void {
    this.form.get('containTypes')!.valueChanges.subscribe(types => {
      if (!types.includes(70)) {
        return;
      }

      if (types.length === 0) {
        this.form.get('containTypes')!.setValue([70], { emitEvent: false });
      }
    });
  }


  onApply(): void {
    const value = this.form.value;
    const filter: ExportFilter = {
      containTypes: value.containTypes?.length ? value.containTypes : null,
      startTime: value.startTime ? new Date(value.startTime) : null,
      endTime: value.endTime ? new Date(value.endTime) : null,
    };
    this.loading = true;
    if (this.exportType == 'pdf') {
      this.service
        .exportPdf(this.id, filter)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: async (d: LabBookExport) => {
            await this.pollingExport(d.identifier, this.exportType);
          },
          error: (err) => {
            const e = err as { statusText?: string; message?: string };
            const msg = e.statusText ?? e.message ?? 'Unknown error';
            this.toastrService.error(`Pdf Export Error: ${msg}`);
            this.loading = false;
            this.modalRef.close();
          }
        });

    }
    if (this.exportType == 'zip') {
      this.service
        .exportZip(this.id, filter)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: async (d: LabBookExport) => {
            await this.pollingExport(d.identifier, this.exportType);
          },
          error: (err) => {
            const e = err as { statusText?: string; message?: string };
            const msg = e.statusText ?? e.message ?? 'Unknown error';
            this.toastrService.error(`Zip Export Error: ${msg}`);
            this.loading = false;
            this.modalRef.close();
          }
        });

    }

  }

  async pollingExport(identifier: string, exportType: string) {
    let response: HttpResponse<Blob>;
    do {
      response = await lastValueFrom(
        this.httpClient.get(`${environment.apiUrl}/labbooks/get_export/${identifier}`, {
          responseType: 'blob',
          observe: 'response',
        }).pipe(delay(3000))
      );
    } while (response && response.status === 204);
    if (response && response.status === 200) {
      const file = new Blob([response.body!], { type: `application/${exportType}` });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(file);
      a.download = this.title + `.${exportType}`;
      a.click();
    }
    this.modalRef.close();
  }

  toggleContainType(ct: ContainType) {
    const current = this.form.controls['containTypes'].value as ContainType[];

    if (current.includes(ct)) {
      this.form.controls['containTypes'].setValue(
        current.filter(v => v !== ct)
      );
    } else {
      this.form.controls['containTypes'].setValue([...current, ct]);
    }
  }


  ngOnDestroy() {
    // unsubscribe everything at modal exit
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  public get headerText(): string {
    switch (this.exportType) {
      case 'pdf':
        return this.translocoService.translate('labBook.exportSelect.headerPdf');
      case 'zip':
        return this.translocoService.translate('labBook.exportSelect.headerZip');
      default:
        return this.translocoService.translate('labBook.exportSelect.header');
    }
  }
}
