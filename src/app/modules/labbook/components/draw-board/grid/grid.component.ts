import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import {
  FilesService,
  LabbookCollapseService,
  LabbooksService,
  NotesService,
  PicturesService,
  RestoreEventsService,
  WebSocketService
} from '@app/services';
import {environment} from '@environments/environment';
import type {LabBookElement, LabBookElementPayload,} from '@joeseln/types';
import {DialogRef, DialogService} from '@ngneat/dialog';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import type {GridsterConfig, GridsterItemConfig} from 'angular-gridster2';
import {
  catchError,
  concatMap,
  delay,
  from,
  of,
  Subscription,
  tap,
  timer
} from 'rxjs';
import {switchMap, take} from 'rxjs/operators';
import {ToastrService} from 'ngx-toastr';
import {TranslocoService} from '@jsverse/transloco';
import {gridsterConfig} from '../../../config/gridster-config';
import {
  highlight_element_background_color
} from "@app/modules/labbook/config/admin-element-background-color";
import {
  AddElementModalComponent
} from "@app/modules/labbook/components/modals/add_new/addelem.component";

/** Gridster item with rendering flag. */
interface GridsterItemWithElement extends GridsterItemConfig {
  element: LabBookElement<unknown>;
  label?: string;
}


@UntilDestroy()
@Component({
  selector: 'mlzeln-labbook-draw-board-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class LabBookDrawBoardGridComponent implements OnInit, OnDestroy {
  @Input()
  public id!: string;


  @Input()
  public editable? = false;

  public loading = true;

  private updateSubscription: Subscription | null = null;

  /** pks of elements whose position/size changed locally and not yet synced */
  private changedPks: Set<string> = new Set();

  public drawBoardElements: Array<GridsterItemConfig> = [];

  public labbookElements: Array<any> = []

  public options: GridsterConfig = {
    ...gridsterConfig,
    scrollToNewItems : false,
    itemChangeCallback: (item: GridsterItemConfig) => this.markElementChanged(item),
    itemResizeCallback: (item: GridsterItemConfig) => this.markElementChanged(item),
  };

  public socketLoading = false;

  private websocketSubscription: Subscription = new Subscription();

  public socketRefreshTimeout?: any;

  public queuedSocketRefreshes = false;

  public modalRef?: DialogRef;

  public constructor(
    public readonly labBooksService: LabbooksService,
    public readonly notesService: NotesService,
    private readonly cdr: ChangeDetectorRef,
    private readonly websocketService: WebSocketService,
    private readonly toastrService: ToastrService,
    private readonly renderer: Renderer2,
    private readonly ngZone: NgZone,
    private readonly modalService: DialogService,
    private collapseService: LabbookCollapseService,
    private readonly translocoService: TranslocoService,
    public readonly picturesService: PicturesService,
    public readonly filesService: FilesService,
    private readonly restoreEvents: RestoreEventsService
  ) {
  }

  public ngOnInit(): void {

  }

  ngAfterViewInit() {
    // initial heavy load outside Angular
    this.ngZone.runOutsideAngular(() => {
      this.initDetails();   // chunked Gridster loading
    });
    // eslint-disable-next-line
    this.websocketSubscription = this.websocketService.subscribeLabbook(this.id).subscribe((data: any) => {
      if (data.model_pk === this.id) {
        if (data.action === 'strict_mode_enabled') {
          this.toastrService.warning(
            'Strict mode is enabled. You can only edit elements you created yourself.',
            '',
            {positionClass: 'toast-top-center'}
          )
        } else {
          // Sadly, we need a timeout here because the logic for the LabBook operations is
          // mainly in the frontend and the backend sends a socket request when the first
          // API request (in the browser of another user) resolved. But we really should wait
          // for all API calls which we can't, because we don't know what's going on in another
          // browser. If the logic moves to the backend, we can remove the timeout.
          if (this.socketRefreshTimeout) {
            clearTimeout(this.socketRefreshTimeout);
          }
          this.ngZone.runOutsideAngular(() => {
            this.socketRefreshTimeout = setTimeout(() => {
              this.softReload();
            }, environment.labBookSocketRefreshInterval);
          });
        }
      }
    });
  }

  public ngOnDestroy(): void {
    if (this.websocketSubscription) {
      this.websocketSubscription.unsubscribe();
    }
    this.websocketService.unsubscribeLabbook(this.id);
  }

  public initDetails(): void {

    this.labBooksService
      .getElements(this.id)
      .pipe(
        untilDestroyed(this),
        catchError(() => {
          this.loading = false;
          return of([]);
        }),
        switchMap(elements => {
          // If empty → no chunking
          if (elements.length === 0) {
            return of({elements, isEmpty: true});
          }
          // Otherwise → chunk normally
          const cleaned = this.cleanElements(elements);
          const chunks = this.chunk(cleaned, 200);
          return from(chunks).pipe(
            concatMap(chunk => of({
              elements: chunk,
              isEmpty: false
            }).pipe(delay(50)))
          );
        })
      )
      .subscribe(({elements, isEmpty}) => {
        if (isEmpty) {
          // Direct render, no chunking
          this.drawBoardElements = [];
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }

        // Normal chunked append
        const gridItems = this.convertToGridItems(elements);
        this.drawBoardElements = [...this.drawBoardElements, ...gridItems];

        this.loading = false;
        this.cdr.markForCheck();
      });
  }


  private chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  cleanElements<T extends LabBookElement<any>>(elements: T[]): T[] {
    // Sort by y then x for deterministic placement
    const sorted = [...elements].sort((a, b) =>
      a.position_y === b.position_y
        ? a.position_x - b.position_x
        : a.position_y - b.position_y
    );

    const occupied = new Set<string>();

    const isFree = (x: number, y: number, w: number, h: number) => {
      for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) {
          if (occupied.has(`${xx},${yy}`)) return false;
        }
      }
      return true;
    };

    const mark = (x: number, y: number, w: number, h: number) => {
      for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) {
          occupied.add(`${xx},${yy}`);
        }
      }
    };

    const cleaned: T[] = [];

    for (const el of sorted) {
      let x = Math.max(0, el.position_x);
      let y = Math.max(0, el.position_y);
      const w = el.width;
      const h = el.height;

      // Push down until free
      while (!isFree(x, y, w, h)) {
        y++;
      }

      mark(x, y, w, h);

      cleaned.push({
        ...el,
        position_x: x,
        position_y: y
      });
    }

    return cleaned;
  }


  public updateAllElements(): void {
    this.scheduleSync();
  }

  /**
   * drag/resize callback — mark the item as changed and schedule a debounced update
   */
  private markElementChanged(item: GridsterItemConfig): void {
    const pk = (item as GridsterItemWithElement).element.pk;
    if (pk) {
      this.changedPks.add(pk);
    }
    this.scheduleSync();
  }

  /**
   * One shared debounce for every grid change.
  **/
  private scheduleSync(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
    this.ngZone.runOutsideAngular(() => {
      this.updateSubscription = timer(1000)
        .pipe(
          switchMap(() => {
            const payload = this.convertToLabBookElementPayload(
              this.drawBoardElements.filter(element =>
                this.changedPks.has((element as GridsterItemWithElement).element.pk)
              )
            );
            if (payload.length === 0) {
              this.changedPks.clear();
              this.continue_search();
              return of(null);
            }
            return this.labBooksService
              .updateAllElements(this.id, payload)
              .pipe(
                tap(() => {
                  this.changedPks.clear();
                  this.continue_search();
                }),
                catchError(() => {
                  return of(null);
                }),
              );
          }),
        )
        .subscribe();
    });
  }

  public getMaxYPosition(elements?: LabBookElement<any>[]): number {
    let elementsToConsider: { y: number; rows: number }[] = [];

    if (elements?.length) {
      elementsToConsider = elements.map(element => ({
        y: element.position_y,
        rows: element.height
      }));
    } else {
      elementsToConsider = this.drawBoardElements.map(element => ({
        y: element.y,
        rows: element.rows
      }));
    }

    if (!elementsToConsider.length) {
      return 0;
    }

    return Math.max(...elementsToConsider.map(element => element.y + element.rows));
  }


  public softReload(): void {
    if (this.socketLoading) {
      this.queuedSocketRefreshes = true;
      return;
    }
    this.socketLoading = true;

    this.labBooksService.getElements(this.id)
      .pipe(untilDestroyed(this))
      .subscribe(labBookElements => {
        const newdrawBoardElements: GridsterItemConfig[] = this.convertToGridItems(labBookElements);

        // index incoming items by pk so every pass below is O(n) instead of O(n*m).
        const incomingByPk = new Map<string, GridsterItemConfig>();
        for (const item of newdrawBoardElements) {
          incomingByPk.set(item['element'].pk, item);
        }

        const updatedElements: GridsterItemConfig[] = [];
        for (const drawBoardElement of this.drawBoardElements) {
          const fresh = incomingByPk.get(drawBoardElement['element'].pk);
          if (!fresh) {
            // element no longer exists server-side → drop it
            continue;
          }
          updatedElements.push({
            ...drawBoardElement,
            x: fresh.x,
            y: fresh.y,
            cols: fresh.cols,
            rows: fresh.rows,
            resizeEnabled: fresh.resizeEnabled,
            element: (fresh as GridsterItemWithElement).element,
            label: (fresh as GridsterItemWithElement).label,
          });
          incomingByPk.delete((drawBoardElement as GridsterItemWithElement).element.pk);
        }

        // remaining incoming items are new
        const elementsToAdd = [...incomingByPk.values()];
        this.drawBoardElements = [...updatedElements, ...elementsToAdd];

        this.socketLoading = false;
        this.cdr.markForCheck();

        if (this.queuedSocketRefreshes) {
          this.queuedSocketRefreshes = false;
          this.softReload();
        }

        // offer jumping to new elements
        if (elementsToAdd.length != 0 && !this.queuedSocketRefreshes) {
          // eslint-disable-next-line
          elementsToAdd.sort(((a, b) => a['element']['last_modified_at'] - b['element']['last_modified_at']))
          const lastestElem = elementsToAdd[0];
          this.toastrService.info('New element added, click to jump')
            .onTap
            .pipe(take(1))
            .subscribe(() => this.toasterClickToJump(lastestElem.y));
        }
      });
  }

  private toasterClickToJump(position_y: number) {
    const row_height =  this.options.fixedRowHeight! + this.options.margin!;
    const pos = position_y * row_height;
    window.scrollTo({top: pos, behavior: 'smooth'});
  }

  public onGridDoubleClick(event: MouseEvent) {
    const gridElement = (event.currentTarget as HTMLElement);
    const rect = gridElement.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.getRowFromCoordinates(y);
  }

  public getRowFromCoordinates(y: number) {
    const rowHeight = this.options.fixedRowHeight || this.options['cellHeight'];
    const margin = this.options.margin || 0;
    const effectiveRowHeight = rowHeight + margin;
    const row = Math.floor(y / effectiveRowHeight);
    this.onOpenNewElemModal(row)
  }


  public onOpenNewElemModal(position: number): void {
    this.modalRef = this.modalService.open(AddElementModalComponent, {
      closeButton: false,
      width: '652px',
      data: {
        labBookId: this.id,
        position: position
      },
    });
  }




  public convertToGridItems(elements: LabBookElement<any>[]): GridsterItemConfig[] {
    return elements.map(element => ({
      label: element.display,
      x: element.position_x,
      y: element.position_y,
      cols: element.width,
      rows: element.height,
      resizeEnabled: this.editable,
      element: element,
    }));
  }

  public convertToLabBookElementPayload(elements: GridsterItemConfig[]): LabBookElementPayload[] {
    return elements.map(element => ({
      pk: element['element'].pk as string,
      width: element.cols,
      height: element.rows,
      position_x: element.x,
      position_y: element.y,
    }));
  }

  public moveElementsVertically(
    distance: number,
    direction: 'down' | 'up' = 'down',
    yStartPosition = 0,
    elements?: GridsterItemConfig[]
  ): GridsterItemConfig[] {
    let currentElements: GridsterItemConfig[] = [];
    const movedElements: GridsterItemConfig[] = [];

    if (elements?.length) {
      currentElements = elements;
    } else {
      currentElements = this.drawBoardElements;
    }

    currentElements.forEach(drawBoardElement => {
      const shift = drawBoardElement.y >= yStartPosition;
      const newY = shift
        ? direction === 'down'
          ? drawBoardElement.y + distance
          : drawBoardElement.y - distance
        : drawBoardElement.y;

      movedElements.push({
        cols: drawBoardElement.cols,
        rows: drawBoardElement.rows,
        x: drawBoardElement.x,
        y: newY,
        resizeEnabled: drawBoardElement.resizeEnabled!,
        element: drawBoardElement['element'],
      });

      if (!elements?.length && shift) {
        this.changedPks.add((drawBoardElement as GridsterItemWithElement).element.pk);
      }
    });

    if (!elements?.length) {
      this.drawBoardElements = [...movedElements];
    }

    return movedElements;
  }


  public continue_search(): void {
    const pos = Number(localStorage.getItem('pageVerticalposition')) || 0;
    localStorage.removeItem('pageVerticalposition');
    const element_pk = localStorage.getItem('element_pk') || 0
    localStorage.removeItem('element_pk');
    const content_type = localStorage.getItem('content_type') || 0
    localStorage.removeItem('content_type');
    let search_text = localStorage.getItem('search_text') || 0
    localStorage.removeItem('search_text');
    let note_inserted = localStorage.getItem('note_inserted') || 0
    localStorage.removeItem('note_inserted');
    let elem_deleted = localStorage.getItem('elem_deleted') || 0
    localStorage.removeItem('elem_deleted');

    const comment_changed_pos = Number(localStorage.getItem('comment_change')) || 0;
    localStorage.removeItem('comment_change');


    if (note_inserted !== 0) {
      window.scrollTo({top: pos, behavior: 'smooth'});
    } else if (elem_deleted !== 0) {
      window.scrollTo({top: pos, behavior: 'smooth'});
    } else if (comment_changed_pos !== 0) {
      window.scrollTo({top: comment_changed_pos, behavior: 'smooth'});
    } else if (content_type !== 0) {
      window.scrollTo({top: pos, behavior: 'smooth'});
    }

    search_text = String(search_text).trim().toLowerCase()


    setTimeout(() => {


      if (element_pk && (content_type === 'shared_elements.note' || content_type === 'shared_elements.file')) {

        const elem = this.getElem(element_pk + '_preloaded_id');
        const title = this.getElem(element_pk + '_title_id');

        if (elem && title) {
          const content = this.applyHighlighting(elem, search_text);
          const title_content = this.getTitleContent(title).toLowerCase();
          const content_lc = content.toLowerCase();

          this.setBorderIfMatch(elem, content_lc, search_text);
          this.setBorderIfMatch(title, title_content, search_text);

          // highlight background if no matches
          if (
            content_type === 'shared_elements.note' &&
            !title_content.includes(search_text) &&
            !content_lc.includes(search_text)
          ) {
            this.renderer.setStyle(title, 'background-color', highlight_element_background_color);
            this.renderer.setStyle(elem, 'background-color', highlight_element_background_color);
          }
        }
      }

      if (element_pk && content_type === 'pictures.picture') {
        const title = this.getElem(element_pk + '_title_id');
        if (title) this.renderer.setStyle(title, 'border', 'thick solid red');
      }

      if (element_pk && content_type === 'labbooks.labbook') {

        const elem = this.getElem(element_pk + '_preloaded_id');
        if (elem) {
          const content = this.applyHighlighting(elem, search_text);
          const content_lc = content.toLowerCase();
          this.setBorderIfMatch(elem, content_lc, search_text);
          // highlight background if no matches
          if (
            !content_lc.includes(search_text)
          ) {
            this.renderer.setStyle(elem, 'background-color', highlight_element_background_color);
          }
        }

        const title = this.getElem(element_pk + '_title_id');
        if (title) {
          const title_content = this.getTitleContent(title).toLowerCase();
          this.setBorderIfMatch(title, title_content, search_text);
        }

        this.open_details();
      }


    }, 1000);  // end set timeout


  }

  trackByElementId(index: number, item: any): string {
    return item['element']['child_object_id'];
  }

  open_details() {
    this.collapseService.setCollapsed(false);
  }


  stripImages(html: string): string {
    return html.replace(/<img[^>]*>/gi, '');
  }

  getElem(id: string) {
    return document.getElementById(id);
  }

  getTitleContent(titleElem: HTMLElement | null): string {
    if (!titleElem) return '';
    const input = titleElem.querySelector('input');
    return input ? input.value : '';
  }

applyHighlighting(elem: HTMLElement, search_text: string) {
  const html = this.stripImages(elem.innerHTML);

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const regex = new RegExp(search_text, "gi");

  let node;
  while ((node = walker.nextNode())) {
    const text = node.nodeValue;
    if (!text) continue;

    if (regex.test(text)) {
      const wrapper = doc.createElement("span");
      wrapper.innerHTML = text.replace(
        regex,
        '<span style="background-color: yellow; font-weight: bold">$&</span>'
      );

      const fragment = doc.createDocumentFragment();
      fragment.append(...wrapper.childNodes);

      node.parentNode?.replaceChild(fragment, node);
    }
  }

  const finalHtml = doc.body.innerHTML;
  this.renderer.setProperty(elem, "innerHTML", finalHtml);

  return finalHtml;
}


  setBorderIfMatch(elem: HTMLElement, text: string, search_text: string) {
    if (text.includes(search_text)) {
      this.renderer.setStyle(elem, 'border', 'thick solid red');
    }
  }


  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();

    // receive data of element to be restore
    const rawData = event.dataTransfer?.getData('application/json');
    if (!rawData) {
      return;
    }
    const data: any = JSON.parse(rawData);
    if (!data || !data['child_object_id'] || !data['child_object_content_type'] ) {
      return;
    }

    // calculate target row number
    const gridElement = (event.currentTarget as HTMLElement);
    const rect = gridElement.getBoundingClientRect();
    // easiest way to apply a css transform to the mouse position of the restore
    const vertical_offset = 20

    const y = event.clientY - rect.top - vertical_offset;
    const rowHeight = this.options.fixedRowHeight || this.options['cellHeight'];
    const margin = this.options.margin || 0;
    const effectiveRowHeight = rowHeight + margin;
    const row = Math.floor(y / effectiveRowHeight);
    const safeRow = Math.max(0, row);
    const contentType = data['child_object_content_type'];
    const id = data['child_object_id'];

    switch (contentType) {
      case 30:  // Note
        this.notesService.restore(id, safeRow).subscribe((note) => {
          if (note) {
            this.restoreEvents.notifyRestored(id);
            this.translocoService
              .selectTranslate('restoreElement.toastr.success')
              .subscribe((success: string) => {
                this.toastrService.success(success);
              });
          }
        });
        break;

      case 40:  // Picture
        this.picturesService.restore(id, safeRow).subscribe((pic) => {
          if (pic) {
            this.restoreEvents.notifyRestored(id);
            this.translocoService
              .selectTranslate('restoreElement.toastr.success')
              .subscribe((success: string) => {
                this.toastrService.success(success);
              });
          }
        });
        break;

      case 50:  // File
        this.filesService.restore(id, safeRow).subscribe((file) => {
          if (file) {
            this.restoreEvents.notifyRestored(id);
            this.translocoService
              .selectTranslate('restoreElement.toastr.success')
              .subscribe((success: string) => {
                this.toastrService.success(success);
              });
          }
        });
        break;

      default:
        console.error('Unsupported content type:', contentType);
    }
  }
}
