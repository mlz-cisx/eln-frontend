import {BreakpointObserver} from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {Router} from '@angular/router';
import {ModalState} from '@app/enums/modal-state.enum';
import {
  DeleteModalComponent
} from '@app/modules/trash/components/modals/delete/delete.component';
import type {ExportLink, ModalCallback, Privileges} from '@joeseln/types';
import {DialogConfig, DialogRef, DialogService} from '@ngneat/dialog';
import {TranslocoService} from '@jsverse/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {take} from 'rxjs/operators';
import {lastValueFrom} from "rxjs";
import {HttpClient} from '@angular/common/http';
import {environment} from "@environments/environment";
import {
  ExportFilter,
  ExportSelectModalComponent
} from "@app/modules/labbook/components/modals/export_select/export-select.component";

@UntilDestroy()
@Component({
    selector: 'mlzeln-details-dropdown',
    templateUrl: './details-dropdown.component.html',
    styleUrls: ['./details-dropdown.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class DetailsDropdownComponent implements OnInit {
  @Input()
  public service!: any;

  @Input()
  public is_labbook!: any;

  @Input()
  public id?: string;

  @Input()
  public initialState?: any;

  @Input()
  public redirectDestination?: string[] = ['/'];

  @Input()
  public newModalComponent?: any;

  @Input()
  public backdropClose = true;

  @Input()
  public privilegesElement = true;

  @Input()
  public trashElement = true;

  @Input()
  public exportElement = true;

  @Input()
  public duplicateElement = true;

  @Input()
  public shareElement = false;

  @Input()
  public privileges?: Privileges;

  @Output() pngExportRequested = new EventEmitter<void>();

  public modalRef?: DialogRef;

  public loading = false;

  public dropdown = true;

  public detailsCollapsed = true;

  public constructor(
    private readonly modalService: DialogService,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly httpClient: HttpClient
  ) {
  }

  public ngOnInit(): void {
    this.breakpointObserver
      .observe(['(min-width: 769px)'])
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        /* istanbul ignore if */
        if (res.matches) {
          this.dropdown = true;
          this.detailsCollapsed = true;
          this.cdr.markForCheck();
          return;
        }
        this.dropdown = false;
        this.cdr.markForCheck();
      });
  }

  public onOpenPrivilegesModal(): void {
  }

  public onExport(): void {
    if (this.initialState.content_type === 10) {
      this.onSelectExportModal()
    } else {
      if (this.loading) {
        return;
      }
      this.loading = true;

      this.service
        .export(this.id)
        .pipe(untilDestroyed(this))
        .subscribe(
          (exportLink: ExportLink) => {
            //window.open(exportLink.url, '_blank');
            this.onClick(exportLink.url, exportLink.filename)
            this.loading = false;
            this.cdr.markForCheck();
          },
          () => {
            this.loading = false;
            this.cdr.markForCheck();
          }
        );
    }
  }

  public onPngExport(): void {
    this.pngExportRequested.emit();
  }

  public async onExportZip(): Promise<void> {
    const apiUrl = `${environment.apiUrl}/labbooks/`;
    const url = (`${apiUrl}${this.id}/export_as_zip/`)
    const response = await lastValueFrom(this.httpClient.get(url, {
      responseType: 'blob',
      observe: 'response'
    }));
    const a = document.createElement("a");
    const file = new Blob([response.body!], {type: 'application/zip'});
    a.href = URL.createObjectURL(file);
    a.setAttribute('download', this.initialState.title)
    a.click();
    URL.revokeObjectURL(url);
  }


  public async onClick(export_link: string, filename: string): Promise<void> {
    const response = await lastValueFrom(this.httpClient.get(export_link, {
      responseType: 'blob',
      observe: 'response',
    }));
    const a = document.createElement("a");
    const file = new Blob([response.body!], {type: 'application/pdf'});
    a.href = URL.createObjectURL(file);
    a.setAttribute('download', filename)
    a.click();
  }

  public async onExportLabbookPdf(
    export_link: string,
    filename: string,
    filter: ExportFilter
  ): Promise<void> {

    const params: any = {};

    if (filter.containTypes?.length) {
      params.containTypes = filter.containTypes;
    }

    if (filter.startTime) {
      params.startTime = filter.startTime.toISOString();
    }

    if (filter.endTime) {
      params.endTime = filter.endTime.toISOString();
    }


    const response = await lastValueFrom(
      this.httpClient.get(export_link, {
        params,
        responseType: 'blob',
        observe: 'response',
      })
    );

    const file = new Blob([response.body!], {type: 'application/pdf'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = filename;
    a.click();
  }


  public onDelete(): void {
    const userSetting = 'SkipDialog-Trash';

    const skipTrashDialog = true

    if (skipTrashDialog) {
      this.delete(this.id!);
    } else {
      this.modalRef = this.modalService.open(DeleteModalComponent, {
        closeButton: false,
        data: {id: this.id, service: this.service, userSetting},
      } as DialogConfig);

      this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
    }
  }

  public delete(id: string): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.service
      .delete(id)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          void this.router.navigate(this.redirectDestination ?? ['/']);
          this.translocoService
            .selectTranslate('trashElement.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
        },
        () => {
          this.loading = false;
        }
      );
  }

  public onRestore(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.service
      .restore(this.id)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          void this.router.navigate(this.redirectDestination ?? ['/']);
          this.translocoService
            .selectTranslate('restoreElement.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
        },
        () => {
          this.loading = false;
        }
      );
  }

  public onOpenNewModal(initialState?: any, duplicate?: string): void {
    this.modalRef = this.modalService.open(this.newModalComponent, {
      closeButton: false,
      enableClose: this.backdropClose,
      data: {service: this.service, duplicate, initialState},
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }


  public onOpenShareModal(): void {
  }

  public onSelectExportModal(): void {
    this.modalRef = this.modalService.open(ExportSelectModalComponent, {
      closeButton: false
    });
    this.modalRef.afterClosed$
      .pipe(untilDestroyed(this), take(1))
      .subscribe((filter: ExportFilter | null) => {
        if (filter) {
          this.onExportFilterSelected(filter);
        }
      });

  }

  onExportFilterSelected(filter: ExportFilter): void {
    if (this.loading) {
      return;
    }

    this.loading = true;
    const normalized: ExportFilter = {
      ...filter,
      startTime: filter.startTime ? new Date(filter.startTime) : null,
      endTime: filter.endTime ? new Date(filter.endTime) : null,
    };

    this.service
      .export(this.id, filter)   // PASS FILTER HERE
      .pipe(untilDestroyed(this))
      .subscribe(
        (exportLink: ExportLink) => {
          this.onExportLabbookPdf(exportLink.url, exportLink.filename, normalized);
          this.loading = false;
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );

  }


  public onModalClose(callback?: ModalCallback): void {
    if (callback?.navigate) {
      void this.router.navigate(callback.navigate);
    } else if (callback?.state === ModalState.Changed) {
      void this.router.navigate(this.redirectDestination ?? ['/']);
    }
  }

}
