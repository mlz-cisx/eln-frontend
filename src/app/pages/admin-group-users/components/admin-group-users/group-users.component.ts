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
import { AuthService, NotesService, UserService } from '@app/services';
import {
  TableColumn,
  TableColumnChangedEvent,
  TableSortChangedEvent,
  TableViewComponent
} from '@joeseln/table';
import type { ModalCallback, User } from '@joeseln/types';
import {DialogRef, DialogService} from '@ngneat/dialog';
import {FormBuilder} from '@ngneat/reactive-forms';
import {TranslocoService} from '@jsverse/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {keyBy, merge, values} from 'lodash';
import { debounceTime, skip, take } from 'rxjs/operators';
import {
  AdminGroupsUsersService
} from "@app/services/admin_users/admin-groups-users.service";
import {
  AdminGroupsService
} from "@app/services/admin_users/admin-groups.service";


@UntilDestroy()
@Component({
    selector: 'mlzeln-group-users-page',
    templateUrl: './group-users.component.html',
    styleUrls: ['./group-users.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class GroupUsersComponent implements OnInit {
  public title = '';

  public currentUser: User | null = null;

  public id = this.route.snapshot.paramMap.get('id')!;

  public defaultColumns: TableColumn[] = [];

  public listColumns: TableColumn[] = [];

  @ViewChild('tableView', {static: true})
  public tableView!: TableViewComponent;

  @ViewChild('subjectCellTemplate', {static: true})
  public subjectCellTemplate!: TemplateRef<any>;

  @ViewChild('firstnameCellTemplate', {static: true})
  public firstnameCellTemplate!: TemplateRef<any>;

  @ViewChild('lastnameCellTemplate', {static: true})
  public lastnameCellTemplate!: TemplateRef<any>;

  @ViewChild('emailCellTemplate', {static: true})
  public emailCellTemplate!: TemplateRef<any>;

  @ViewChild('createdAtCellTemplate', {static: true})
  public createdAtCellTemplate!: TemplateRef<any>;

  @ViewChild('createdByCellTemplate', {static: true})
  public createdByCellTemplate!: TemplateRef<any>;

  @ViewChild('lastModifiedAtCellTemplate', {static: true})
  public lastModifiedAtCellTemplate!: TemplateRef<any>;

  @ViewChild('lastModifiedByCellTemplate', {static: true})
  public lastModifiedByCellTemplate!: TemplateRef<any>;

  @ViewChild('actionsCellTemplate', {static: true})
  public actionsCellTemplate!: TemplateRef<any>;

  public modalRef?: DialogRef;

  public loading = false;


  public usersControl = this.fb.control<number | null>(null);

  public searchControl = this.fb.control<string | null>(null);

  public favoritesControl = this.fb.control<boolean | null>(null);

  public params = new HttpParams();

  public users: User[] = [];

  public sorting?: TableSortChangedEvent;

  public showUserFilter = false;

  public savedFilters = false;

  public constructor(
    public readonly notesService: NotesService,
    private readonly router: Router,
    private readonly modalService: DialogService,
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly titleService: Title,
    private readonly authService: AuthService,
    private user_service: UserService,
    public readonly admin_group_users_service: AdminGroupsUsersService,
    public readonly admin_groups_service: AdminGroupsService
  ) {
  }



  public ngOnInit(): void {

    this.user_service.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.initTranslations();
    this.initSidebar();
    this.initSearch();
    this.initSearchInput();
    this.initPageTitle();
  }

  public initTranslations(): void {

    this.translocoService
      .selectTranslateObject('users.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.defaultColumns = [
          {
            cellTemplate: this.subjectCellTemplate,
            name: column.username,
            key: 'username',
            sortable: true,
          },
          {
            cellTemplate: this.firstnameCellTemplate,
            name: column.first_name,
            key: 'first_name',
            sortable: true,
          },
          {
            cellTemplate: this.lastnameCellTemplate,
            name: column.last_name,
            key: 'last_name',
            sortable: true,
          },
          {
            cellTemplate: this.emailCellTemplate,
            name: column.email,
            key: 'email',
            sortable: true,
          },
          {
            cellTemplate: this.createdAtCellTemplate,
            name: column.createdAt,
            key: 'created_at',
            sortable: true,
          },
          {
            cellTemplate: this.lastModifiedAtCellTemplate,
            name: column.lastModifiedAt,
            key: 'last_modified_at',
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
    this.admin_groups_service.getpagetitle(this.id).pipe(untilDestroyed(this))
      .subscribe(title => {
          this.title = title
          this.cdr.markForCheck();
        }
      )
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

    this.listColumns = values(merged) as TableColumn[];
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

  public openNewModal(): void {
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.navigate) {
      void this.router.navigate(callback.navigate);
    } else if (callback?.state === ModalState.Changed) {
      this.tableView.loadData();
    }
  }
}
