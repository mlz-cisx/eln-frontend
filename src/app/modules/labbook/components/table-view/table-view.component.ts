import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {TableColumn, TableViewComponent} from "@joeseln/table";
import {HttpParams} from "@angular/common/http";
import {LabbookTableService, UserService} from '@app/services';
import {FormBuilder} from '@ngneat/reactive-forms';
import {TranslocoService} from '@jsverse/transloco';
import {User} from "@joeseln/types";
import {debounceTime, skip} from "rxjs/operators";
import {
  MetaTooltipComponent
} from '@app/modules/labbook/components/meta-tooltip/meta-tooltip.component';
import {Overlay, OverlayRef} from '@angular/cdk/overlay';
import {ComponentPortal} from '@angular/cdk/portal';


@UntilDestroy()
@Component({
  selector: 'mlzeln-labbook-table-view',
  templateUrl: './table-view.component.html',
  styleUrls: ['./table-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})

export class LabBookTableViewComponent implements OnInit, OnDestroy {
  public title = '';

  public currentUser: User | null = null;

  @Input()
  public id!: string;

  @ViewChild('tableView', {static: true})
  public tableView!: TableViewComponent;

  @ViewChild('titleCellTemplate', {static: true})
  public titleCellTemplate!: TemplateRef<any>;

  @ViewChild('entity_typeCellTemplate', {static: true})
  public entity_typeCellTemplate!: TemplateRef<any>;

  @ViewChild('createdAtCellTemplate', {static: true})
  public createdAtCellTemplate!: TemplateRef<any>;

  @ViewChild('createdByCellTemplate', {static: true})
  public createdByCellTemplate!: TemplateRef<any>;

  @ViewChild('lastModifiedAtCellTemplate', {static: true})
  public lastModifiedAtCellTemplate!: TemplateRef<any>;

  @ViewChild('lastModifiedByCellTemplate', {static: true})
  public lastModifiedByCellTemplate!: TemplateRef<any>;


  public defaultColumns: TableColumn[] = [];

  public listColumns: TableColumn[] = [];

  public params = new HttpParams();

  public searchControl = this.fb.control<string | null>(null);

  private overlayRef: OverlayRef | null = null;
  private hoverList = false;
  private hoverTooltip = false;
  private tooltipOpen = false;
  private closeTimer: any = null;


  public constructor(
    public readonly labbooktableservice: LabbookTableService,
    private readonly translocoService: TranslocoService,
    private readonly fb: FormBuilder,
    private user_service: UserService,
    private overlay: Overlay,
  ) {
  }

  public ngOnInit(): void {
    this.user_service.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.initTranslations();
    this.initSearch();
  }

  public ngOnDestroy(): void {
    this.hideMetaTooltip()
  }


  public initTranslations(): void {
    this.translocoService
      .selectTranslate('files.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
      });

    this.translocoService
      .selectTranslateObject('files.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.defaultColumns = [
          {
            cellTemplate: this.titleCellTemplate,
            name: column.title,
            key: 'title',
            sortable: true,
            width: '20%',
          },
          {
            cellTemplate: this.entity_typeCellTemplate,
            name: column.entity_type,
            key: 'entity_type',
            sortable: true,
            width: '10%',
          },

          {
            cellTemplate: this.createdAtCellTemplate,
            name: column.createdAt,
            key: 'created_at',
            sortable: true,
          },
          {
            cellTemplate: this.createdByCellTemplate,
            name: column.createdBy,
            key: 'created_by_uname',
            sortable: true,
          },
          {
            cellTemplate: this.lastModifiedAtCellTemplate,
            name: column.lastModifiedAt,
            key: 'last_modified_at',
            sortable: true,
          },
          {
            cellTemplate: this.lastModifiedByCellTemplate,
            name: column.lastModifiedBy,
            key: 'last_modified_by_uname',
            sortable: true,
          },
        ];

        this.listColumns = [...this.defaultColumns];

      });
  }


  public initSearch(): void {

    this.searchControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const queryParams = new URLSearchParams(window.location.search);

      if (value) {
        this.params = this.params.set('search', value);
        this.tableView.loadData(false, this.params);
        queryParams.set('search', value);
        history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
      } else {
        this.params = this.params.delete('search');
        this.tableView.loadData(false, this.params);
        queryParams.delete('search');
        history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
      }
    });

  }


  showMetaTooltip(origin: HTMLElement, result: any) {
    if (!result || !result.pk) return;

    this.tooltipOpen = true;
    this.hoverTooltip = false;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(origin)
      .withPositions([
        {
          originX: 'end',
          originY: 'center',
          overlayX: 'start',
          overlayY: 'center',
          offsetX: 30 // tooltip RIGHT of element
        }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: false,
      panelClass: 'meta-tooltip-panel',
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });

    const tooltipPortal = new ComponentPortal(MetaTooltipComponent);
    const tooltipRef = this.overlayRef.attach(tooltipPortal);


    tooltipRef.instance.hoverState.subscribe(state => {
      if (state === 'enter') {
        this.hoverTooltip = true;

        // Cancel pending close
        if (this.closeTimer) {
          clearTimeout(this.closeTimer);
          this.closeTimer = null;
        }

      } else {
        this.hoverTooltip = false;
        this.evaluateTooltipClose();
      }
    });

    if (result.content_type_model === 'shared_elements.file') {

      tooltipRef.instance.htmlMode = true;
      tooltipRef.instance.canvasMode = false;
      tooltipRef.instance.elem_uuid = result.pk
      tooltipRef.instance.elem_type = 'shared_elements.file'
    }

    if (result.content_type_model === 'pictures.picture') {
      tooltipRef.instance.canvasMode = true;
      tooltipRef.instance.htmlMode = false;
      tooltipRef.instance.elem_uuid = result.pk
      return;
    }


    if (result.content_type_model === 'shared_elements.note') {


      tooltipRef.instance.htmlMode = true;
      tooltipRef.instance.canvasMode = false;
      tooltipRef.instance.elem_uuid = result.pk
      tooltipRef.instance.elem_type = 'shared_elements.note'
    }

  }


  hideMetaTooltip() {
    this.tooltipOpen = false;


    this.hoverList = false;
    this.hoverTooltip = false;

    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }

    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }


  onTableRowEnter(origin: HTMLElement, row: any): void {
    this.hoverList = true;

    if (!this.tooltipOpen) {
      this.tooltipOpen = true;

      this.showMetaTooltip(origin, {
        pk: row.entity_id,
        content_type_model:
          row.entity_type === 'file'
            ? 'shared_elements.file'
            : row.entity_type === 'note'
              ? 'shared_elements.note'
              : 'pictures.picture'
      });
    }
  }


  onListLeave() {
    this.hoverList = false;

    // Start a short grace timer
    this.closeTimer = setTimeout(() => {
      this.evaluateTooltipClose();
    }, 200);
  }

  evaluateTooltipClose() {
    if (!this.hoverList && !this.hoverTooltip) {
      this.hideMetaTooltip();
    }
  }


}
