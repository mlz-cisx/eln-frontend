import {HttpParams} from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';
import {ModalState} from '@app/enums/modal-state.enum';
import {
  AuthService,
  PicturesService,
} from '@app/services';
import {
  UserService,
} from '@app/services';
import {
  TableColumn,
  TableColumnChangedEvent,
  TableSortChangedEvent,
  TableViewComponent
} from '@joeseln/table';
import type {ModalCallback, Project, User} from '@joeseln/types';
import {DialogRef, DialogService} from '@ngneat/dialog';
import {FormBuilder} from '@ngneat/reactive-forms';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {keyBy, merge, values} from 'lodash';
import {Observable, of, Subject} from 'rxjs';
import {debounceTime,  skip, take} from 'rxjs/operators';

@UntilDestroy()
@Component({
  templateUrl: './pictures-page.component.html',
  styleUrls: ['./pictures-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PicturesPageComponent implements OnInit {
  public title = '';

  public currentUser: User | null = null;

  public defaultColumns: TableColumn[] = [];

  public listColumns: TableColumn[] = [];


  @ViewChild('tableView', {static: true})
  public tableView!: TableViewComponent;

  @ViewChild('titleCellTemplate', {static: true})
  public titleCellTemplate!: TemplateRef<any>;

  @ViewChild('createdAtCellTemplate', {static: true})
  public createdAtCellTemplate!: TemplateRef<any>;

  @ViewChild('createdByCellTemplate', {static: true})
  public createdByCellTemplate!: TemplateRef<any>;

  @ViewChild('lastModifiedAtCellTemplate', {static: true})
  public lastModifiedAtCellTemplate!: TemplateRef<any>;

  @ViewChild('lastModifiedByCellTemplate', {static: true})
  public lastModifiedByCellTemplate!: TemplateRef<any>;

  @ViewChild('heightCellTemplate', {static: true})
  public heightCellTemplate!: TemplateRef<any>;

  @ViewChild('widthCellTemplate', {static: true})
  public widthCellTemplate!: TemplateRef<any>;

  @ViewChild('actionsCellTemplate', {static: true})
  public actionsCellTemplate!: TemplateRef<any>;

  @ViewChild('lb_titleCellTemplate', {static: true})
  public lb_titleCellTemplate!: TemplateRef<any>;

  public modalRef?: DialogRef;

  public projectsControl = this.fb.control<string | null>(null);

  public usersControl = this.fb.control<number | null>(null);

  public searchControl = this.fb.control<string | null>(null);

  public favoritesControl = this.fb.control<boolean | null>(null);

  public params = new HttpParams();

  public users: User[] = [];

  public usersInput$ = new Subject<string>();

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];


  public showSidebar = false;

  public project?: string;

  public sorting?: TableSortChangedEvent;

  public showUserFilter = false;

  public savedFilters = false;

  public constructor(
    public readonly picturesService: PicturesService,
    private readonly router: Router,
    private readonly modalService: DialogService,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly userService: UserService,
    private readonly titleService: Title,
    private readonly authService: AuthService,
    private user_service: UserService,
  ) {
  }

  public get filtersChanged(): boolean {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    return Boolean(this.projectsControl.value || this.usersControl.value || this.searchControl.value || this.favoritesControl.value);
  }

  public get getFilterSelectedUser(): User | undefined {
    return this.users.find(user => user.pk === this.usersControl.value);
  }

  public get getFilterSelectedProject(): Project | undefined {
    return this.projects.find(project => project.pk === this.projectsControl.value);
  }

  public ngOnInit(): void {

    this.user_service.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.initTranslations(this.showSidebar);
    this.initSidebar();
    this.initSearch(this.showSidebar);
    this.initSearchInput();
    this.initPageTitle();
  }

  public initTranslations(project = false): void {
    this.translocoService
      .selectTranslate('pictures.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
      });

    this.translocoService
      .selectTranslateObject('pictures.columns')
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
            cellTemplate: this.createdAtCellTemplate,
            name: column.createdAt,
            key: 'created_at',
            sortable: true,
          },
          {
            cellTemplate: this.createdByCellTemplate,
            name: column.createdBy,
            key: 'created_by',
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
            key: 'last_modified_by',
            sortable: true,
          },
          {
            cellTemplate: this.heightCellTemplate,
            name: column.height,
            key: 'height',
            sortable: false,
            hidden: true,
          },
          {
            cellTemplate: this.widthCellTemplate,
            name: column.width,
            key: 'width',
            sortable: false,
            hidden: true,
          },
          {
            cellTemplate: this.lb_titleCellTemplate,
            name: column.lb_title,
            key: 'lb_title',
            sortable: false,
          },
          {
            cellTemplate: this.actionsCellTemplate,
            name: '',
            key: 'actions',
            hideable: false,
          },
        ];
        this.listColumns = [...this.defaultColumns];

      });
  }

  public initSidebar(): void {
  }

  public initSearch(project = false): void {



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

      if (this.savedFilters) {
        this.onSaveFilters(true);
      } else {
        this.onSaveFilters(false);
      }
    });


    this.route.queryParamMap.pipe(untilDestroyed(this), take(1)).subscribe(queryParams => {
      const search = queryParams.get('search');
      const favorites = queryParams.get('favorites');

      if (search) {
        this.searchControl.setValue(search);
      }

      if (favorites) {
        this.favoritesControl.setValue(Boolean(favorites));
      }
    });
  }

  public initSearchInput(): void {
  }

  public initPageTitle(): void {
  }

  public onFilterItems(showTrashedItems: boolean): void {
    if (showTrashedItems) {
      this.params = this.params.set('deleted', 'true');
    } else {
      this.params = this.params.delete('deleted');
    }
    this.tableView.loadData(false, this.params);
  }

  public onRestore(restored: boolean): void {
    if (restored) {
      this.tableView.loadData(false, this.params);
    }
  }

  public onColumnsChanged(event: TableColumnChangedEvent): void {
    const merged = merge(
      keyBy(event, 'key'),
      keyBy(
        this.defaultColumns.map(column => ({
          cellTemplate: column.cellTemplate,
          key: column.key,
        })),
        'key'
      )
    );

    this.listColumns = values<TableColumn>(merged);
    const settings = this.listColumns.map(col => ({
      key: col.key,
      sort: col.sort,
      hidden: col.hidden,
      hideable: col.hideable,
    }));
  }

  public onSortChanged(event: TableSortChangedEvent): void {
  }

  public onSaveFilters(save: boolean): void {
    this.savedFilters = save;
  }

  public onUserFilterRadioAnyone(): void {
    this.showUserFilter = false;
    this.users = [];
  }

  public onUserFilterRadioMyself(checked: boolean): void {
    if (checked && this.currentUser) {
      this.showUserFilter = false;
      this.users = [this.currentUser];
    }
  }

  public onResetFilters(): void {
    this.params = new HttpParams();
    history.pushState(null, '', window.location.pathname);

    this.projectsControl.setValue(null, {emitEvent: false});
    this.projects = [];

    this.usersControl.setValue(null, {emitEvent: false});
    this.users = [];

    this.searchControl.setValue(null, {emitEvent: false});

    this.favoritesControl.setValue(null);
  }

  public canDeactivate(): Observable<boolean> {

    return of(true);
  }

  public openSketchModal(): void {
  }

  public openNewPictureModal(): void {
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.navigate) {
      void this.router.navigate(callback.navigate, {relativeTo: this.route});
    } else if (callback?.state === ModalState.Changed) {
      this.tableView.loadData();
    }
  }
}
