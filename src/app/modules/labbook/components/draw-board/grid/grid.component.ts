import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import {
  LabbookCollapseService,
  LabbooksService,
  NotesService,
  WebSocketService
} from '@app/services';
import {environment} from '@environments/environment';
import type {
  LabBookElement,
  LabBookElementEvent,
  LabBookElementPayload,
} from '@joeseln/types';
import {ModalCallback} from "@joeseln/types";
import {DialogRef, DialogService} from '@ngneat/dialog';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import type {GridsterConfig, GridsterItem} from 'angular-gridster2';
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
import {gridsterConfig} from '../../../config/gridster-config';
import {
  highlight_element_background_color
} from "@app/modules/labbook/config/admin-element-background-color";
import {ModalState} from "@app/enums/modal-state.enum";
import {
  AddElementModalComponent
} from "@app/modules/labbook/components/modals/add_new/addelem.component";


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
  public created?: EventEmitter<LabBookElementEvent>;

  @Output()
  public elem_created = new EventEmitter<LabBookElementEvent>();

  @Input()
  public editable? = false;

  public loading = true;

  private updateSubscription: Subscription | null = null;

  public drawBoardElements: Array<GridsterItem> = [];

  public labbookElements: Array<any> = []

  public options: GridsterConfig = {
    ...gridsterConfig,
    scrollToNewItems : false,
    itemChangeCallback: () => this.updateAllElements(),
    itemResizeCallback: () => this.updateAllElements(),
  };

  public socketLoading = false;

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
    private collapseService: LabbookCollapseService
  ) {
  }

  public ngOnInit(): void {

    this.created?.subscribe((event: LabBookElementEvent) => {
      this.addElement(event);
    });

  }

  ngAfterViewInit() {
    // initial heavy load outside Angular
    this.ngZone.runOutsideAngular(() => {
      this.initDetails();   // chunked Gridster loading
    });


    this.websocketService.elements.pipe().subscribe((data: any) => {
      if (data.model_pk === this.id) {
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
    });
  }

  public ngOnDestroy(): void {
  }


  public initDetails(): void {
    this.disableScrollToNewItems()
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


  private disableScrollToNewItems(): void {
    this.options.scrollToNewItems = false;
    // Tell Gridster to re-read the updated config
    this.options.api?.optionsChanged?.call(this.options);
  }

  private enableScrollToNewItems(): void {
    this.options.scrollToNewItems = true;
    // Tell Gridster to re-read the updated config
    this.options.api?.optionsChanged?.call(this.options);
  }


  public addElement(event: LabBookElementEvent): void {
    // Basically it would be ideal to let all the grids (the main grid and all the section grids)
    // handle the add logic themselves. However, this is not possible because this code only gets
    // executed when the grid is initialized. This is only the case for the main grid as it is
    // always visible and sections can be closed at any time (which means the grid may not be
    // initialized at the time of adding an element to a section). That's why we must handle
    // section logic in the main grid too.
    // If logic for the LabBook moves to the backend this whole code can be deleted.

    if (this.loading) {
      return;
    }
    this.loading = true;

    const addToLabBook = event.parentElement === 'labBook';
    const addToSection = !addToLabBook;

    let getSectionElements$ = of([] as LabBookElement<any>[]);
    let sectionElements: LabBookElement<any>[] | undefined;

    if (addToSection) {
      getSectionElements$ = this.labBooksService.getElements(this.id, event.parentElement).pipe(untilDestroyed(this));
    }

    getSectionElements$
      .pipe(
        untilDestroyed(this),
        switchMap(elements => {
          if (addToSection) {
            sectionElements = [...elements];
          }

          const element: LabBookElementPayload = {
            child_object_content_type: event.childObjectContentType,
            child_object_id: event.childObjectId,
            position_x: 0,
            position_y: event.position === 'top' ? 0 : this.getMaxYPosition(sectionElements),
            width: 13,
            height: event.height ?? 10,
          };

          return this.labBooksService.addElement(this.id, element).pipe(untilDestroyed(this));
        }),
      )
      .subscribe(
        labBookElement => {
          const newGridElement: GridsterItem = {
            label: labBookElement.display,
            x: labBookElement.position_x,
            y: labBookElement.position_y,
            cols: labBookElement.width,
            rows: labBookElement.height,
            resizeEnabled: this.editable,
            element: labBookElement,
          };

          if (addToLabBook) {
            if (event.position === 'top') {
              this.moveElementsVertically(labBookElement.height);
            }

            this.drawBoardElements.push(newGridElement);
          } else if (addToSection) {
            if (event.position === 'top') {
              if (sectionElements?.length) {
                const sectionGridElements = this.convertToGridItems(sectionElements);
                const movedSectionGridElements = this.moveElementsVertically(labBookElement.height, 'down', 0, sectionGridElements);
                this.updateAllElements([
                  ...this.convertToLabBookElementPayload([newGridElement]),
                  ...this.convertToLabBookElementPayload(movedSectionGridElements),
                ]);
              }
            }

            // emit section reload
          }

          this.loading = false;
          this.cdr.markForCheck();
          //  preloaded content has to be rendered again if position is top
          if (event.position === 'top') {
            this.updateAllElements();
          }

        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public updateAllElements(elements?: LabBookElementPayload[]): void {

    if (this.updateSubscription) {
      // if there is a previous update, unsubscribe to cancel it
      this.updateSubscription.unsubscribe();
    }

    const elementsPayload =
      elements ?? this.convertToLabBookElementPayload(this.drawBoardElements);

    this.ngZone.runOutsideAngular(() => {
      this.updateSubscription = timer(1000)
        .pipe(
          switchMap(() => {
            return this.labBooksService
              .updateAllElements(this.id, elementsPayload)
              .pipe(
                tap(() => {
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
    // this.enableScrollToNewItems()
    if (this.socketLoading) {
      this.queuedSocketRefreshes = true;
      return;
    }
    this.socketLoading = true;

    this.labBooksService
      .getElements(this.id)
      .pipe(untilDestroyed(this))
      .subscribe(labBookElements => {
        const oldDrawBoardElements = [...this.drawBoardElements];
        const newdrawBoardElements: GridsterItem[] = this.convertToGridItems(labBookElements);

        // Remove deleted elements
        const elementsToRemove = oldDrawBoardElements.filter(
          (oldField: GridsterItem) => !newdrawBoardElements.some((newField: GridsterItem) => oldField['element'].pk === newField['element'].pk)
        );
        elementsToRemove.forEach(element => {
          for (let index = this.drawBoardElements.length - 1; index >= 0; index--) {
            const drawBoardElement = this.drawBoardElements[index];
            if (drawBoardElement['element'].pk === element['element'].pk) {
              this.drawBoardElements.splice(index, 1);
            }
          }
        });

        // Update existing elements
        newdrawBoardElements
          .filter((newField: GridsterItem) =>
            oldDrawBoardElements.some((oldField: GridsterItem) => newField['element'].pk === oldField['element'].pk)
          )
          .forEach(element => {
            this.drawBoardElements.forEach((drawBoardElement, index) => {
              if (drawBoardElement['element'].pk === element['element'].pk) {
                this.drawBoardElements[index].x = element.x;
                this.drawBoardElements[index].y = element.y;
                this.drawBoardElements[index].cols = element.cols;
                this.drawBoardElements[index].rows = element.rows;
              }
            });
          });

        // We must tell the options that we changed them even though we didn't. This way Gridster will
        // check the changed properties of items and visually apply them. This is important if we move
        // or resize items. As long as Gridster won't implement better support we need this workaround.
        this.options.api?.optionsChanged?.();

        // Add new elements
        const elementsToAdd = newdrawBoardElements.filter(
          (newField: GridsterItem) => !oldDrawBoardElements.some((oldField: GridsterItem) => newField['element'].pk === oldField['element'].pk)
        );
        this.drawBoardElements = [...this.drawBoardElements, ...elementsToAdd];

        this.socketLoading = false;
        this.socketRefreshTimeout = undefined;
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
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }


  public onModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.elem_created.emit(callback.data);
    }
  }


  public convertToGridItems(elements: LabBookElement<any>[]): GridsterItem[] {
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

  public convertToLabBookElementPayload(elements: GridsterItem[]): LabBookElementPayload[] {
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
    elements?: GridsterItem[]
  ): GridsterItem[] {
    let currentElements: GridsterItem[] = [];
    const movedElements: GridsterItem[] = [];

    if (elements?.length) {
      currentElements = elements;
    } else {
      currentElements = this.drawBoardElements;
    }

    currentElements.forEach(drawBoardElement => {
      let newY = drawBoardElement.y;

      if (drawBoardElement.y >= yStartPosition) {
        if (direction === 'down') {
          newY = drawBoardElement.y + distance;
        } else {
          newY = drawBoardElement.y - distance;
        }
      }

      movedElements.push({
        cols: drawBoardElement.cols,
        rows: drawBoardElement.rows,
        x: drawBoardElement.x,
        y: newY,
        resizeEnabled: drawBoardElement.resizeEnabled!,
        element: drawBoardElement['element'],
      });
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


    setTimeout(() => {

      // get all possibilities for header and title also for file
      if (document.getElementById(element_pk + '_preloaded_id') && (content_type == 'shared_elements.note' || content_type == 'shared_elements.file' ||
        content_type == 'labbooks.labbook')) {
        // @ts-ignore
        const elem = document.getElementById(element_pk + '_preloaded_id')
        const title = document.getElementById(element_pk + '_title_id')
        // @ts-ignore
        const content = elem.innerHTML
        // @ts-ignore
        if (content.includes(search_text)) {
          // @ts-ignore
          this.renderer.setStyle(elem, 'border', 'thick solid red');
        }
        // @ts-ignore
        const title_content = title.querySelector('input').value
        // @ts-ignore
        if (title_content.includes(search_text)) {
          // @ts-ignore
          this.renderer.setStyle(title, 'border', 'thick solid red');
        }
        search_text = '' + search_text
        const highlightedContent = content.replace(
          new RegExp('' + search_text, 'gi'),
          '<span style="background-color: yellow; font-weight: bold">$&</span>'
        );
        // @ts-ignore
        this.renderer.setProperty(elem, 'innerHTML', highlightedContent);
        if (document.getElementById(element_pk + '_preloaded_id') && (content_type == 'shared_elements.note')
          && !title_content.includes(search_text) && !content.includes(search_text)) {
          this.renderer.setStyle(title, 'background-color', highlight_element_background_color);
          this.renderer.setStyle(elem, 'background-color', highlight_element_background_color);
        }
      }
      if (content_type == 'pictures.picture') {
        // @ts-ignore
        const title = document.getElementById(element_pk + '_title_id')
        this.renderer.setStyle(title, 'border', 'thick solid red');
      }

      if (note_inserted !== 0) {
      }
      const elem = document.getElementById(element_pk + '_preloaded_id')
      const title = document.getElementById(element_pk + '_title_id')
      // @ts-ignore
      if (elem) {
        this.renderer.setStyle(title, 'background-color', highlight_element_background_color);
        this.renderer.setStyle(elem, 'background-color', highlight_element_background_color);
      }

      if (content_type == 'labbooks.labbook') {
        this.open_details()
      }

    }, 1000);  // end set timeout


  }

  trackByElementId(index: number, item: any): string {
    return item['element']['child_object_id'];
  }

  open_details() {
    this.collapseService.setCollapsed(false);
  }
}
