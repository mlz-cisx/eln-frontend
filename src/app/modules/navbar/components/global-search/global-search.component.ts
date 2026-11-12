import {HttpParams} from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  ContentTypeModelService,
  LabbooksService,
  SearchService
} from '@app/services';
import type {ContentTypeModels} from '@joeseln/types';
import {FormBuilder} from '@ngneat/reactive-forms';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {BsDropdownDirective} from 'ngx-bootstrap/dropdown';
import {debounceTime, skip} from 'rxjs/operators';
import {
  LabBookDrawBoardGridComponent
} from "@app/modules/labbook/components/draw-board/grid/grid.component";
import {ComponentPortal} from '@angular/cdk/portal';
import {
  MetaTooltipComponent
} from "@app/modules/labbook/components/meta-tooltip/meta-tooltip.component";
import {ConnectedPosition, Overlay, OverlayRef} from '@angular/cdk/overlay';

interface FromSearch {
  search: string | null;
  note: boolean;
  file: boolean;
  labbook: boolean;
  picture: boolean;
}

@UntilDestroy()
@Component({
    selector: 'mlzeln-global-search',
    templateUrl: './global-search.component.html',
    styleUrls: ['./global-search.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class GlobalSearchComponent implements OnInit {
  @ViewChild('searchDropdown')
  public dropdown!: BsDropdownDirective;

  @ViewChild('searchInput')
  public searchInput!: ElementRef;

  public loading = false;

  public selectedContentTypes: string[] = [];

  public params = new HttpParams();

  public results: any[] = [];

  private row_height = this.gridComponent!.options!.fixedRowHeight! + this.gridComponent!.options!.margin!;

  public form = this.fb.group<FromSearch>({
    search: null,
    note: false,
    file: false,
    labbook: false,
    picture: false,
  });

  private overlayRef: OverlayRef | null = null;
  private hoverList = false;
  private hoverTooltip = false;
  private tooltipOpen = false;

  public constructor(
    private readonly searchService: SearchService,
    private readonly contentTypeModelService: ContentTypeModelService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly labbooksService: LabbooksService,
    private gridComponent: LabBookDrawBoardGridComponent,
    private overlay: Overlay,
  ) {
  }

  public get f() {
    return this.form.controls;
  }

  public ngOnInit(): void {
    this.initSearch();
  }

  public initSearch(): void {
    this.f.search.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(() => {
      this.search();
    });
  }

  public get searchText(): string | null {
    return this.f.search.value;
  }

  public onChangeFilter(event: any, contentType: ContentTypeModels): void {
    const modelName = this.contentTypeModelService.get(contentType, 'modelName');
    if (modelName) {
      if (event.target.checked) {
        this.selectedContentTypes.push(modelName);
      } else {
        const index = this.selectedContentTypes.indexOf(modelName);
        this.selectedContentTypes.splice(index, 1);
      }
      this.search();
    }
    this.searchInput.nativeElement.focus();
  }

  public search(): void {
    this.loading = false;
    if (this.searchText?.trim() && this.selectedContentTypes.length > 0) {
      this.loading = true;
      this.params = this.params.set('model', this.selectedContentTypes.join(','));
      this.searchService
        .search(this.searchText?.trim(), this.params)
        .pipe(untilDestroyed(this))
        .subscribe(results => {
          this.results = [...results];
          this.loading = false;
          this.dropdown.show();
          this.cdr.markForCheck();
        });
    } else {
      this.results = [];
    }
    this.cdr.markForCheck();
  }

  public go_to_labbook(result_pk: any): void {
    this.labbooksService
      .getList()
      .pipe(
        untilDestroyed(this),
      ).subscribe(
      labbooks => {
        labbooks.data.forEach(
          lb => {
            this.labbooksService
              .getElements(lb.pk)
              .pipe(untilDestroyed(this))
              .subscribe(labBookElements => {
                labBookElements.map(element => {
                })
              });
          }
        )
      }
    )
  }

  public resetSearch(): void {
    this.selectedContentTypes = [];
    this.form.reset();
    this.hideMetaTooltip()
    this.search();
  }

  public hideDropdown(labbook_pos_y: any, element_pk: any, content_type: any): void {
    localStorage.setItem('pageVerticalposition', String((labbook_pos_y) * this.row_height))
    localStorage.setItem('element_pk', String(element_pk))
    localStorage.setItem('content_type', String(content_type))
    localStorage.setItem('search_text', String(this.searchText))
    this.dropdown.hide();
    this.resetSearch();
  }


  showMetaTooltip(origin: HTMLElement, result: any) {
    if (!result || !result.pk) return;

    this.tooltipOpen = true;
    this.hoverTooltip = false;

    const leftPosition: ConnectedPosition = {
      originX: 'start',
      originY: 'center',
      overlayX: 'end',
      overlayY: 'center',
      offsetX: -10 // Tooltip LEFT of element
    };

    const rightPosition: ConnectedPosition = {
      originX: 'end',
      originY: 'center',
      overlayX: 'start',
      overlayY: 'center',
      offsetX: 10 // Tooltip RIGHT of element
    };

    let positions: ConnectedPosition[] = [leftPosition, rightPosition]; // Default: left (with right fallback)

    const container = origin.closest('.results-container');
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const itemRect = origin.getBoundingClientRect();

      // Check if the layout has 2 columns (item width is roughly half of container)
      const isTwoColumns = itemRect.width <= containerRect.width * 0.6;

      if (isTwoColumns) {
        const containerCenterX = containerRect.left + containerRect.width / 2;
        const itemCenterX = itemRect.left + itemRect.width / 2;

        if (itemCenterX >= containerCenterX) {
          // Right column -> place tooltip on the RIGHT (with left fallback if off-screen)
          positions = [rightPosition, leftPosition];
        }
      }
    }

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(origin)
      .withPositions(positions);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: false,
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
      tooltipRef.instance.elem_uuid = result.element_pk
      tooltipRef.instance.elem_type = 'shared_elements.file'
    }

    if (result.content_type_model === 'pictures.picture') {
      tooltipRef.instance.canvasMode = true;
      tooltipRef.instance.htmlMode = false;
      tooltipRef.instance.elem_uuid = result.element_pk
      return;
    }


    if (result.content_type_model === 'shared_elements.note') {
      tooltipRef.instance.htmlMode = true;
      tooltipRef.instance.canvasMode = false;
      tooltipRef.instance.elem_uuid = result.element_pk
      tooltipRef.instance.elem_type = 'shared_elements.note'
    }

    if (result.content_type_model === 'labbooks.labbook') {
      tooltipRef.instance.htmlMode = true;
      tooltipRef.instance.canvasMode = false;
      tooltipRef.instance.elem_uuid = result.element_pk
      tooltipRef.instance.elem_type = 'labbooks.labbook'
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


  onListEnter(origin: HTMLElement, result: any) {
    if (!result || !result.pk) return;   // FIX

    this.hoverList = true;

    this.hideMetaTooltip()
    if (!this.tooltipOpen) {
      this.tooltipOpen = true;
      this.showMetaTooltip(origin, result);
    }
  }


  private closeTimer: any = null;

  onListLeave() {
    this.hoverList = false;

    // Start a short grace timer
    this.closeTimer = setTimeout(() => {
      this.evaluateTooltipClose();
    }, 300);
  }

  evaluateTooltipClose() {
    if (!this.hoverList && !this.hoverTooltip) {
      this.hideMetaTooltip();
    }
  }


}
