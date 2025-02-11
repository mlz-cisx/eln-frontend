/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter, HostListener,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {ModalState} from '@app/enums/modal-state.enum';
import {
  // LabBookSectionsService,
  LabbooksService,
  WebSocketService
} from '@app/services';
import {environment} from '@environments/environment';
import type {
  LabBookElement,
  LabBookElementEvent,
  LabBookElementPayload,
  ModalCallback
} from '@joeseln/types';
import {
  DialogRef,
  //DialogService
} from '@ngneat/dialog';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import type {
  GridsterComponent,
  GridsterConfig,
  GridsterItem
} from 'angular-gridster2';
import {of} from 'rxjs';
import {map, switchMap, take} from 'rxjs/operators';
import {gridsterConfig} from '../../../config/gridster-config';
import type {
  LabBookDrawBoardElementComponent
} from '../element/element.component';
import {
  LabBookPendingChangesModalComponent
} from '../modals/pending-changes/pending-changes.component';


interface ElementRemoval {
  id: string;
  gridReload: boolean;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-labbook-draw-board-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookDrawBoardGridComponent implements OnInit, OnDestroy {
  @ViewChild('drawBoard', {static: true})
  public drawBoard!: TemplateRef<GridsterComponent>;

  @ViewChildren('elementComponent')
  public elements?: QueryList<LabBookDrawBoardElementComponent>;

  @Input()
  public id!: string;

  @Input()
  public section?: string;

  @Input()
  public created?: EventEmitter<LabBookElementEvent>;

  @Input()
  public refresh?: EventEmitter<boolean>;

  @Input()
  public editable? = true;

  public closeSection = new EventEmitter<string>();

  public refreshElementRelations = new EventEmitter<{ model_name: string; model_pk: string }>();

  public loading = true;

  public updated_self = false;

  public drawBoardElements: Array<GridsterItem> = [];

  public labbookElements: Array<any> = []

  public expandedSection?: string;

  public options: GridsterConfig = {
    ...gridsterConfig,
    itemChangeCallback: () => this.updateAllElements(),
    itemResizeCallback: () => this.updateAllElements(),
  };

  public socketLoading = false;

  public socketRefreshTimeout?: any;

  public queuedSocketRefreshes = false;

  public modalRef?: DialogRef;

  public constructor(
    public readonly labBooksService: LabbooksService,
    // public readonly labBookSectionsService: LabBookSectionsService,
    // private readonly modalService: DialogService,
    private readonly cdr: ChangeDetectorRef,
    private readonly websocketService: WebSocketService,
  ) {
  }

  public ngOnInit(): void {
    // this.websocketService.subscribe([{model: 'labbook', pk: this.id}]);
    this.websocketService.elements.pipe().subscribe((data: any) => {
      // console.log('grid pipe ', data['action'])
      if (data.model_pk === this.id) {

        // Sadly, we need a timeout here because the logic for the LabBook operations is
        // mainly in the frontend and the backend sends a socket request when the first
        // API request (in the browser of another user) resolved. But we really should wait
        // for all API calls which we can't, because we don't know what's going on in another
        // browser. If the logic moves to the backend, we can remove the timeout.
        if (this.socketRefreshTimeout) {
          clearTimeout(this.socketRefreshTimeout);
        }

        if (data.model_name === 'labbook_patch') {
          this.reload()
        } else {
          this.socketRefreshTimeout = setTimeout(() => this.softReload(), environment.labBookSocketRefreshInterval);
        }


        // this.updated_self = false
      } else if (data) {
        this.refreshElementRelations.next(data);
      }
    });

    this.initDetails();

    this.created?.subscribe((event: LabBookElementEvent) => {
      this.addElement(event);
    });

    this.refresh?.subscribe((reload: boolean) => {
      if (reload) {
        this.reload();
      }
    });
  }

  public ngOnDestroy(): void {
    // this.websocketService.unsubscribe();
  }


  public initDetails(): void {
    this.labBooksService
      .getElements(this.id, this.section)
      .pipe(untilDestroyed(this))
      .subscribe(
        labBookElements => {
          console.log(labBookElements)
          labBookElements.forEach(element => this.drawBoardElements.push(...this.convertToGridItems([element])));
          this.loading = false;
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public chunk(arr: any, len: any) {
    var chunks = [],
      i = 0,
      n = arr.length;

    while (i < n) {
      chunks.push(arr.slice(i, i += len));
    }
    return chunks;
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
            position_y: event.position === 'top' ? 0 : this.getMaxYPosition(sectionElements, addToSection),
            width: 13,
            height: event.height ?? this.getNewElementHeight(event.childObjectContentTypeModel),
          };

          return this.labBooksService.addElement(this.id, element).pipe(untilDestroyed(this));
        }),

        // switchMap(labBookElement => {
        //   if (addToLabBook) {
        //     return of(labBookElement);
        //   }
        //
        //   sectionElements ??= [];
        //
        //   return this.labBookSectionsService
        //     .patch(event.parentElement, {
        //       pk: event.parentElement,
        //       child_elements: [...sectionElements.map(e => e.pk), labBookElement.pk],
        //     })
        //     .pipe(
        //       untilDestroyed(this),
        //       map(() => labBookElement)
        //     );
        // })
      )
      .subscribe(
        labBookElement => {
          const newGridElement: GridsterItem = {
            label: labBookElement.display,
            x: labBookElement.position_x,
            y: labBookElement.position_y,
            cols: labBookElement.width,
            rows: labBookElement.height,
            resizeEnabled: true,
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
            this.specialupdateAllElements()
          }

        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public updateAllElements(elements?: LabBookElementPayload[]): void {
    if (!this.editable) {
      return;
    }

    // Delay the process for a tick or else gridster won't recognize the changes
    setTimeout(() => {
      if (this.loading) {
        return;
      }
      this.loading = true;

      // this.updated_self = true;

      const elementsPayload = elements ?? this.convertToLabBookElementPayload(this.drawBoardElements);

      this.labBooksService
        .updateAllElements(this.id, elementsPayload)
        .pipe(untilDestroyed(this))
        .subscribe(
          () => {
            this.loading = false;
            this.cdr.markForCheck();
            this.continue_search()
          },
          () => {
            this.loading = false;
            this.cdr.markForCheck();
          }
        );
    }, 1);
  }

  public specialupdateAllElements(elements?: LabBookElementPayload[]): void {
    if (!this.editable) {
      return;
    }

    // Delay the process for a tick or else gridster won't recognize the changes
    setTimeout(() => {
      if (this.loading) {
        return;
      }
      this.loading = true;

      // this.updated_self = true;

      const elementsPayload = elements ?? this.convertToLabBookElementPayload(this.drawBoardElements);

      this.labBooksService
        .updateAllElements(this.id, elementsPayload)
        .pipe(untilDestroyed(this))
        .subscribe(
          () => {
            this.loading = false;
            this.cdr.markForCheck();
            // we need reload, because preloaded content has to be rendered again
            this.reload()
          },
          () => {
            this.loading = false;
            this.cdr.markForCheck();
          }
        );
    }, 1);
  }

  public getMaxYPosition(elements?: LabBookElement<any>[], addToSection = false): number {
    let elementsToConsider: { y: number; rows: number }[] = [];

    if (elements?.length) {
      elementsToConsider = elements.map(element => ({
        y: element.position_y,
        rows: element.height
      }));
    } else if (addToSection) {
      return 0;
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

  public onRemove(event: ElementRemoval): void {
    if (event.gridReload) {
      this.reload();
    } else {
      let index = 0;
      this.drawBoardElements.forEach(drawBoardElement => {
        if (drawBoardElement['element'].pk === event.id) {
          this.drawBoardElements.splice(index, 1);
          this.moveElementsVertically(drawBoardElement.rows, 'up', drawBoardElement.y);
          return;
        }

        index++;
      });
    }
  }

  public reload(): void {
    this.drawBoardElements = [];
    this.initDetails();
  }

  public reload_given_drawboard(): void {
    this.softReload()
  }


  public softReload(): void {
    if (this.socketLoading) {
      this.queuedSocketRefreshes = true;
      return;
    }
    this.socketLoading = true;

    this.labBooksService
      .getElements(this.id, this.section)
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
      });
  }

  public onExpandSection(id: string): void {
    if (!this.expandedSection || !this.pendingChanges()) {
      this.switchSectionStates(id);
      return;
    }

    // this.modalRef = this.modalService.open(LabBookPendingChangesModalComponent, {
    //   closeButton: false,
    //   data: {id},
    // });

    // this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback?: ModalCallback) => {
    //   if (callback?.state === ModalState.Changed) {
    //     this.switchSectionStates(id);
    //   }
    // });
  }

  public switchSectionStates(id: string): void {
    this.expandedSection = id;
    this.closeSection.next(id);
  }

  public convertToGridItems(elements: LabBookElement<any>[]): GridsterItem[] {
    return elements.map(element => ({
      label: element.display,
      x: element.position_x,
      y: element.position_y,
      cols: element.width,
      rows: element.height,
      resizeEnabled: true,
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

  public getItemZIndex(item: GridsterItem): number {
    if (item['element'].child_object_content_type_model === 'labbooks.labbooksection') {
      if (this.expandedSection === item['element'].child_object_id) {
        return 3;
      }

      return 2;
    }

    return 1;
  }

  public getItemOverflow(item: GridsterItem): string {
    return item['element'].child_object_content_type_model === 'labbooks.labbooksection' ? 'initial' : 'hidden';
  }

  public getItemResizeEnabled(contentType: string): boolean {
    return contentType !== 'labbooks.labbooksection' && Boolean(this.editable);
  }

  public getNewElementHeight(contentType: string): number {
    return contentType === 'labbooks.labbooksection' ? 1 : 8;
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
        elem.style.border = 'thick solid red'
      }


      // @ts-ignore
      const title_content = title.querySelector('input').value
      // @ts-ignore
      if (title_content.includes(search_text)) {
        // @ts-ignore
        title.style.border = 'thick solid red'
      }

      search_text = '' + search_text

      const highlightedContent = content.replace(
        new RegExp('' + search_text, 'gi'),
        '<span style="background-color: yellow; font-weight: bold">$&</span>'
      );


      // @ts-ignore
      elem.innerHTML = highlightedContent
      window.scrollTo({top: pos, behavior: 'smooth'});
    }


    if (content_type == 'pictures.picture') {
      // @ts-ignore
      const title = document.getElementById(element_pk + '_title_id')
      // @ts-ignore
      const title_content = title.querySelector('input').value
      // @ts-ignore
      if (title_content.includes(search_text)) {
        // @ts-ignore
        title.style.border = 'thick solid red'
      }
      window.scrollTo({top: pos, behavior: 'smooth'});
    }

    if (note_inserted !== 0) {
      window.scrollTo({top: pos, behavior: 'smooth'});
    }

    if (elem_deleted !== 0) {
      window.scrollTo({top: pos, behavior: 'smooth'});
    }


  }

  public pendingChanges(): boolean {
    for (const element of this.elements ?? []) {
      if (element.pendingChanges()) {
        return true;
      }
    }

    return false;
  }
}
