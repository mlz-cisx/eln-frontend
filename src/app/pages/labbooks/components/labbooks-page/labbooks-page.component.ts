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
import {LabbooksService, UserService} from '@joeseln/services';
import {
  TableColumn,
  TableColumnChangedEvent,
  TableSortChangedEvent,
  TableViewComponent
} from '@joeseln/table';
import type { ModalCallback, User } from '@joeseln/types';
import {DialogConfig, DialogRef, DialogService} from '@ngneat/dialog';
import {FormBuilder} from '@ngneat/reactive-forms';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {keyBy, merge, values} from 'lodash';
import { Observable, of } from 'rxjs';
import {debounceTime, skip, take} from 'rxjs/operators';
import {NewLabBookModalComponent} from '../modals/new/new.component';


@UntilDestroy()
@Component({
  selector: 'mlzeln-labbooks-page',
  templateUrl: './labbooks-page.component.html',
  styleUrls: ['./labbooks-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBooksPageComponent implements OnInit {
  public title = '';

  public currentUser: User | null = null;

  public add_wb_button: Boolean = false;

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

  @ViewChild('lastUpdatedAtCellTemplate', {static: true})
  public lastUpdatedAtCellTemplate!: TemplateRef<any>;

  @ViewChild('lastUpdatedByCellTemplate', {static: true})
  public lastUpdatedByCellTemplate!: TemplateRef<any>;

  @ViewChild('actionsCellTemplate', {static: true})
  public actionsCellTemplate!: TemplateRef<any>;

  public modalRef?: DialogRef;

  public loading = false;


  public usersControl = this.fb.control<number | null>(null);

  public searchControl = this.fb.control<string | null>(null);

  public favoritesControl = this.fb.control<boolean | null>(null);

  public users: User[] = [];

  public params = new HttpParams();



  public showSidebar = false;



  public sorting?: TableSortChangedEvent;

  public showUserFilter = false;

  public savedFilters = false;

  public constructor(
    private readonly router: Router,
    public readonly labbooksService: LabbooksService,
    private readonly modalService: DialogService,
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private user_service: UserService,
    private readonly titleService: Title,
  ) {
  }

  public get filtersChanged(): boolean {
    return true
  }

  public get getFilterSelectedUser(): User | undefined {
    return this.users.find(user => user.pk === this.usersControl.value);
  }

  public ngOnInit(): void {
    this.user_service.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
      if (this.currentUser && this.currentUser.admin) {
        this.add_wb_button = true
      }
    });

    this.initTranslations();
    this.initSidebar();
    this.initSearch();
    this.initSearchInput();
    this.initPageTitle();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslate('labbooks.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
      });

    this.translocoService
      .selectTranslateObject('labbooks.columns')
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
            cellTemplate: this.lastUpdatedAtCellTemplate,
            name: column.lastUpdatedAt,
            key: 'last_modified_at',
            sortable: true,
          },
          {
            cellTemplate: this.lastUpdatedByCellTemplate,
            name: column.lastUpdatedBy,
            key: 'last_modified_by',
            sortable: true,
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


    this.usersControl.setValue(null, {emitEvent: false});
    this.users = [];

    this.searchControl.setValue(null, {emitEvent: false});

    this.favoritesControl.setValue(null);
  }

  public canDeactivate(): Observable<boolean> {
    if (this.showSidebar) {
        return of(true);
    }

    return of(true);
  }

  public openNewModal(): void {

    this.modalRef = this.modalService.open(NewLabBookModalComponent, {
      closeButton: false,
      data: {withSidebar: this.showSidebar, initialState: null},
    } as DialogConfig);

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.navigate) {
      void this.router.navigate(callback.navigate, {relativeTo: this.route});
    } else if (callback?.state === ModalState.Changed) {
      this.tableView.loadData();
    }
  }

}
