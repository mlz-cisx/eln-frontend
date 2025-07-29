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
import {ModalState} from '@app/enums/modal-state.enum';
import {
  CommentsModalComponent
} from '@app/modules/comment/components/modals/comments/comments.component';
import {
  PrivilegesModalComponent
} from '@app/modules/details-dropdown/components/modals/privileges/privileges.component';
import {
  RecentChangesModalComponent
} from '@app/modules/labbook/components/modals/recent-changes/recent-changes.component';
import {
  DeleteModalComponent
} from '@app/modules/trash/components/modals/delete/delete.component';
import {LabbooksService} from '@app/services';
import type {
  ExportLink,
  LabBookElement,
  ModalCallback,
  Privileges
} from '@joeseln/types';
import {DialogConfig, DialogRef, DialogService} from '@ngneat/dialog';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {take} from 'rxjs/operators';
import {v4 as uuidv4} from 'uuid';
import {
  LabBookDrawBoardGridComponent
} from "@app/modules/labbook/components/draw-board/grid/grid.component";
import {lastValueFrom} from "rxjs";
import {HttpClient} from '@angular/common/http';

interface ElementRemoval {
  id: string;
  gridReload: boolean;
}

@UntilDestroy()
@Component({
  selector: 'mlzeln-labbook-element-dropdown',
  templateUrl: './element-dropdown.component.html',
  styleUrls: ['./element-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookElementDropdownComponent implements OnInit {
  @Input()
  public service!: any;

  @Input()
  public id?: string;

  @Input()
  public labBookId!: string;

  @Input()
  public elementId!: string;

  @Input()
  public section?: string;

  @Input()
  public initialState?: any;

  @Input()
  public redirectDestination!: string;

  @Input()
  public privileges?: Privileges;

  @Input()
  public labBookEditable? = false;

  @Input()
  public newModalComponent?: any;

  @Input()
  public minimalistic = false;

  @Output()
  public removed = new EventEmitter<ElementRemoval>();

  @Output()
  public moved = new EventEmitter<ElementRemoval>();

  public modalRef?: DialogRef;

  public loading = false;

  public uniqueHash = uuidv4();

  public dropdown = true;

  public detailsCollapsed = true;

  public constructor(
    private readonly labBooksService: LabbooksService,
    private readonly modalService: DialogService,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly drawboardGridComponent: LabBookDrawBoardGridComponent,
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

  public async onClick(export_link: string, filename: string): Promise<void> {
    const response = await lastValueFrom(this.httpClient.get(export_link, {
      responseType: 'blob',
      observe: 'response'
    }));
    const url = URL.createObjectURL(response.body!);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
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

      this.modalRef.afterClosed$
        .pipe(untilDestroyed(this), take(1))
        .subscribe((callback: ModalCallback) => this.onDeleteModalClose(callback));
    }
  }

  public delete(id: string): void {
    if (this.loading) {
      return;
    }
    this.loading = true;
    var bodyRect = 0
    if (document.body.getBoundingClientRect()) {
      bodyRect = -document.body.getBoundingClientRect().y
    }


    this.service
      .delete(id, this.labBookId)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.loading = false;
          this.translocoService
            .selectTranslate('labBook.elementDropdown.trashElement.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.drawboardGridComponent.softReload()
              this.drawboardGridComponent.updateAllElements()
              this.cdr.markForCheck()
              this.cdr.detectChanges()
            });
        },
        () => {
          this.loading = false;
        }
      );
  }

  public onOpenMoveToSectionModal(): void {
  }

  public onOpenMoveBackToLabBookModal(): void {
  }

  public moveBackToLabBook(): void {
  }

  public remove(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.labBooksService
      .deleteElement(this.labBookId, this.elementId)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.removed.emit({id: this.elementId, gridReload: false});
          this.loading = false;
          this.translocoService
            .selectTranslate('labBook.elementDropdown.removeFromLabBook.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
            });
        },
        () => {
          this.loading = false;
        }
      );
  }

  public onOpenRecentChangesModal(): void {
    this.modalService.open(RecentChangesModalComponent, {
      closeButton: false,
      data: {service: this.service, id: this.id},
    });
  }

  public onRemove(): void {
  }

  public onOpenCommentsModal(): void {
    this.modalService.open(CommentsModalComponent, {
      closeButton: false,
      width: '800px',
      data: {service: this.service, element: this.initialState, create: true},
    });
  }

  public onDeleteModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.remove();
    }
  }

  public onRemoveModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.remove();
    }
  }

  public onMoveElementToSectionModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.moved.emit({id: this.elementId, gridReload: false});
    }
  }

  public onMoveElementToLabBookModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.moved.emit({id: this.elementId, gridReload: false});
    }
  }

  public getMaxYPosition(elements: LabBookElement<any>[]): number {
    if (!elements.length) {
      return 0;
    }

    return Math.max(...elements.map(element => element.position_y + element.height));
  }
}
