import {HttpErrorResponse} from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  NgZone,
  OnDestroy,
  OnInit,
  QueryList,
  Renderer2,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {ModalState} from '@app/enums/modal-state.enum';
import {
  CommentsComponent
} from '@app/modules/comment/components/comments/comments.component';
import {
  NewCommentModalComponent
} from '@app/modules/comment/components/modals/new/new.component';
import type {
  LabBookDrawBoardComponent
} from '@app/modules/labbook/components/draw-board/draw-board/draw-board.component';
import {
  DescriptionModalComponent
} from '@app/modules/shared/modals/description/description.component';
import {
  LabbookCollapseService,
  LabbooksService,
  SearchService,
  WebSocketService
} from '@joeseln/services';
import {UserService} from "@app/services";
import type {
  LabBook,
  LabBookElement,
  LabBookElementPayload,
  LabBookPayload,
  ModalCallback,
  Privileges,
  User,
} from '@joeseln/types';
import {DialogConfig, DialogRef, DialogService} from '@ngneat/dialog';
import {FormBuilder, FormControl} from '@ngneat/reactive-forms';
import {TranslocoService} from '@jsverse/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {Observable, of, Subject} from 'rxjs';
import {debounceTime, map, skip, switchMap, take} from 'rxjs/operators';
import {NewLabBookModalComponent} from '../modals/new/new.component';
import {ToastrService} from 'ngx-toastr';
import {gridsterConfig} from '@app/modules/labbook/config/gridster-config';
import {GridsterConfig} from "angular-gridster2";
import {
  highlight_element_background_color
} from "@app/modules/labbook/config/admin-element-background-color";

interface FormLabBook {
  labbook_title: FormControl<string | null>;
  strict_mode: boolean;
}

@UntilDestroy()
@Component({
  selector: 'mlzeln-labbook-page',
  templateUrl: './labbook-page.component.html',
  styleUrls: ['./labbook-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class LabBookPageComponent implements OnInit, OnDestroy {
  @ViewChild(CommentsComponent)
  public comments!: CommentsComponent;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;


  @ViewChildren('drawBoard')
  public drawBoards?: QueryList<LabBookDrawBoardComponent>;

  public detailsTitle?: string;

  public id = this.route.snapshot.paramMap.get('id')!;


  public currentUser: User | null = null;

  public initialState?: LabBook;


  public privileges?: Privileges;


  public showSidebar = false;

  public loading = true;

  public preloaded_id = '';

  public title_id = '';

  public isCollapsed = true;

  public submitted = false;

  public modalRef?: DialogRef;

  public refreshChanges = new EventEmitter<boolean>();

  public refreshVersions = new EventEmitter<boolean>();

  public refreshResetValue = new EventEmitter<boolean>();


  public refreshLinkList = new EventEmitter<boolean>();

  public newModalComponent = NewLabBookModalComponent;


  results: any[] = [];
  query = '';
  currentIndex = 0;
  searchOpen = false;

  searchInput$ = new Subject<string>();

  public gridster_options: GridsterConfig = {
    ...gridsterConfig,
  };

  private row_height = this.gridster_options.fixedRowHeight! + this.gridster_options.margin!;


  public form = this.fb.group<FormLabBook>({
    labbook_title: this.fb.control(null, Validators.required),
    strict_mode: false,
  });

  public constructor(
    public readonly labBooksService: LabbooksService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly websocketService: WebSocketService,
    private readonly modalService: DialogService,
    private user_service: UserService,
    private collapseService: LabbookCollapseService,
    private readonly toastrService: ToastrService,
    private ngZone: NgZone,
    private readonly renderer: Renderer2,
    private searchService: SearchService
  ) {
  }


  public get f() {
    return this.form.controls;
  }


  public get descriptionTranslationKey(): string {
    return this.initialState?.description ? 'labBook.details.description.edit' : 'labBook.details.description.add';
  }

  private get labBook(): LabBookPayload {
    return {
      title: this.f.labbook_title.value!,
      strict_mode: this.f.strict_mode.value,
    };
  }


  public ngOnInit(): void {
    this.searchService.lb_search$.subscribe(() => {
      this.openSearch();
    });
    document.addEventListener('keydown', this.onKeyDown, true);
    this.searchInput$
      .pipe(
        map(q => q.toLowerCase()),
        debounceTime(500),
        switchMap(q => this.labBooksService.search(this.id, q)),
        untilDestroyed(this)
      )
      .subscribe(results => {
        this.results = results;
        this.cdr.markForCheck()
        this.scroll_to_elem()
      });

    this.collapseService.setCollapsed(true);
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;


    this.user_service.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });


    this.websocketService.elements.pipe(untilDestroyed(this)).subscribe((data: any) => {
      this.cdr.detectChanges();
      if (data.model_pk === this.id && !this.submitted) {
        this.refreshChanges.next(true);
        this.refreshVersions.next(true);
        this.submitted = false
      }
    });

    this.initSidebar();
    this.initSearchInput();
    this.initDetails();
    this.initPageTitle();

    this.collapseService.collapsed$
      .pipe(untilDestroyed(this))
      .subscribe(value => {
        this.isCollapsed = value;
        this.cdr.markForCheck(); // because OnPush
      });
  }


  public ngOnDestroy(): void {
    document.removeEventListener('keydown', this.onKeyDown, true);
  }

  onKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === 'f') {
      event.preventDefault();
      this.openSearch()
    }
  };

  openSearch() {
    this.query = '';
    this.results = [];
    this.currentIndex = 0;

    this.ngZone.runOutsideAngular(() => {
      this.searchOpen = true;
      requestAnimationFrame(() => {
        this.searchInput?.nativeElement?.focus();
        this.cdr.markForCheck();
      });
    });
  }

  close() {
    this.searchOpen = false;
    this.query = '';
    this.results = [];
  }

  next() {
    if (!this.results.length) return;
    this.currentIndex = (this.currentIndex + 1) % this.results.length;
    this.scroll_to_elem()
  }

  prev() {
    if (!this.results.length) return;
    this.currentIndex =
      (this.currentIndex - 1 + this.results.length) % this.results.length;
    this.scroll_to_elem()
  }


  onQueryChange() {
    this.searchInput$.next(this.query.toLowerCase());
  }

  onSearchKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      // Shift+Enter = previous match
      if (event.shiftKey) {
        this.prev();
        return;
      }
      // Enter = trigger debounced search
      this.searchInput$.next(this.query.toLowerCase());
    }
    if (event.key === 'Escape') {
      this.close();
    }
  }


  public scroll_to_elem() {
    if (this.results[this.currentIndex]) {
      const labbook_pos_y = (this.results[this.currentIndex]).labbook_pos_y
      const element_pk = (this.results[this.currentIndex]).element_pk
      const content_type = (this.results[this.currentIndex]).content_type_model

      window.scrollTo({
        top: labbook_pos_y * this.row_height,
        behavior: 'smooth'
      });


      setTimeout(() => {
        if (document.getElementById(element_pk + '_preloaded_id') && (content_type == 'shared_elements.note' || content_type == 'shared_elements.file')) {
          const search_text = this.query.toLowerCase()

          // @ts-ignore
          const elem = document.getElementById(element_pk + '_preloaded_id')
          const title = document.getElementById(element_pk + '_title_id')
          // @ts-ignore
          const content_with_images = elem.innerHTML
          const content = content_with_images.replace(/<img[^>]*>/gi, '')
          // @ts-ignore
          if (content.toLowerCase().includes(search_text)) {
            // @ts-ignore
            this.renderer.setStyle(elem, 'border', 'thick solid red');
          }
          // @ts-ignore
          const title_content = title.querySelector('input').value
          // @ts-ignore
          if (title_content.toLowerCase().includes(search_text)) {
            // @ts-ignore
            this.renderer.setStyle(title, 'border', 'thick solid red');
          }

          const highlightedContent = content.replace(
            new RegExp(search_text, 'gi'),
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
      }, 1000)
    }
  }


  public initFormChanges(): void {
    this.form.valueChanges
      .pipe(
        untilDestroyed(this),
        skip(1),
        debounceTime(500),
        switchMap(() => {
          this.cdr.markForCheck();
          return of([]);
        })
      )
      .subscribe();
  }

  public initSidebar(): void {

  }

  public initSearchInput(): void {

  }

  public initPageTitle(): void {

  }

  public initDetails(formChanges = true): void {


    this.preloaded_id = `${this.id}_preloaded_id`;
    this.title_id = `${this.id}_title_id`;

    this.labBooksService
      .get(this.id)
      .pipe(
        untilDestroyed(this),
        map(privilegesData => {
          const labBook = privilegesData.data;
          const privileges = privilegesData.privileges;
          this.form.patchValue(
            {
              labbook_title: labBook.title,
              strict_mode: labBook.strict_mode,
            },
            {emitEvent: false}
          );

          if (!privileges.edit) {
            this.form.disable({emitEvent: false});
          }

          return privilegesData;
        }),
      )
      .subscribe(
        privilegesData => {
          const labBook = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.detailsTitle = labBook.title;
          //void this.pageTitleService.set(labBook.display);

          this.initialState = {...labBook};
          this.privileges = {...privileges};

          this.loading = false;

          if (formChanges) {
            this.initFormChanges();
          }
          if (labBook.strict_mode) {
            this.toastrService.warning('Strict mode is on. ' +
              'You can only edit elements you created yourself.')
          }
          this.cdr.markForCheck();
        },
        (error: HttpErrorResponse) => {
          if (error.status > 400 && 500 > error.status) {
            void this.router.navigate(['/']);
          }

          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.submitted = true;
    this.labBooksService
      .patch(this.id, this.labBook)
      .pipe(untilDestroyed(this))
      .subscribe(
        labBook => {

          this.detailsTitle = labBook.title;


          this.initialState = {...labBook};
          this.form.markAsPristine();
          this.refreshChanges.next(true);
          this.refreshVersions.next(true);
          this.refreshLinkList.next(true);
          this.refreshResetValue.next(true);

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('labBook.details.toastr.success')
            .pipe(untilDestroyed(this))
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public canDeactivate(): Observable<boolean> {
    if (this.showSidebar) {

      const skipLeaveDialog = true

      if (skipLeaveDialog) {
        return of(true);
      }

    }

    return of(true);
  }

  public pendingChangesDrawBoards(): boolean {

    return false;
  }

  public pendingChanges(): Observable<boolean> {
    if (this.form.dirty || this.pendingChangesDrawBoards()) {
    }

    return of(true);
  }

  public onVersionChanged(): void {
    this.initDetails(false);
    this.refreshVersions.next(true);
    this.refreshChanges.next(true);
    this.refreshLinkList.next(true);
  }

  public onRefreshLinkList(): void {
    this.refreshLinkList.next(true);
  }

  public onOpenNewCommentModal(): void {
    this.modalRef = this.modalService.open(NewCommentModalComponent, {
      closeButton: false,
      width: '912px',
      data: {
        id: this.id,
        contentType: this.initialState?.content_type,
        service: this.labBooksService,
      },
    } as DialogConfig);

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => {
      if (callback.state === ModalState.Changed) {
        this.comments.loadComments();
      }
    });
  }

  public onOpenDescriptionModal(): void {
    this.modalRef = this.modalService.open(DescriptionModalComponent, {
      closeButton: false,
      width: '912px',
      data: {
        id: this.id,
        description: this.initialState?.description ?? '',
        descriptionKey: 'description',
        service: this.labBooksService,
      },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback?: ModalCallback) => {
      if (callback?.state === ModalState.Changed) {
        this.initialState = {...callback.data};
        this.form.markAsPristine();
        this.refreshChanges.next(true);
        this.refreshResetValue.next(true);
      }
    });
  }

  public onUpdateMetadata(): void {
  }

  public goToBottom() {
    window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
  }

  public restructure() {
    const empty_spaces_alt: number[][] = [];
    let max_position = 0;
    let space_count = 0

    this.labBooksService
      .getElements(this.id)
      .pipe(untilDestroyed(this))
      .subscribe(
        labBookElements => {
          labBookElements.forEach(element => {
              if (element.position_y > max_position) {
                space_count += (element.position_y - max_position)
                empty_spaces_alt.push(([element.position_y - 1, space_count]))
              }
              if ((element.position_y + element.height) > max_position) {
                max_position = element.position_y + element.height;
              }
            }
          );

          labBookElements.reverse();
          empty_spaces_alt.reverse().forEach(empty_space_elem => {
            labBookElements.forEach(labbook_elem => {
              if (empty_space_elem[0] <= labbook_elem.position_y) {
                labbook_elem.position_y -= empty_space_elem[1]
              }
            })
          })

          const elementsPayload = this.convertToLabBookElementPayload(labBookElements);

          this.labBooksService
            .updateAllElements(this.id, elementsPayload)
            .pipe(untilDestroyed(this))
            .subscribe(
              () => {
                this.loading = false;
                this.cdr.markForCheck();
                // setTimeout(() => location.reload(), 1000);
              },
              () => {
                this.loading = false;
                this.cdr.markForCheck();
              }
            );
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );

  }

  public convertToLabBookElementPayload(elements: LabBookElement<any>[]): LabBookElementPayload[] {
    return elements.map(element => ({
      pk: element.pk,
      width: element.width,
      height: element.height,
      position_x: element.position_x,
      position_y: element.position_y,
    }));
  }

  public scroll_to_position(pos: number) {
    window.scrollTo({top: pos, behavior: 'smooth'});
  }
}

