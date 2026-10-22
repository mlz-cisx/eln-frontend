import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import {TableColumn, TableViewComponent} from '@joeseln/table';
import type {
  RecentChanges,
  RecentChangesChangeRecord,
  User
} from '@joeseln/types';
import {TranslocoService} from '@jsverse/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {cloneDeep} from 'lodash';
import {debounceTime, map, skip} from 'rxjs/operators';
import {FormBuilder} from "@ngneat/reactive-forms";
import {HttpParams} from "@angular/common/http";

@UntilDestroy()
@Component({
    selector: 'mlzeln-recent-changes',
    templateUrl: './recent-changes.component.html',
    styleUrls: ['./recent-changes.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class RecentChangesComponent implements OnInit {
  @ViewChild('tableView')
  public tableView!: TableViewComponent;

  @ViewChild('dateCellTemplate', {static: true})
  public dateCellTemplate!: TemplateRef<any>;

  @Input()
  public service: any;

  @Input()
  public changesId!: string;

  @Input()
  public refresh?: EventEmitter<boolean>;

  @Input()
  public users?: User[] = [];

  public searchControl = this.fb.control<string | null>(null);

  public params = new HttpParams();

  public listColumns: TableColumn[] = [];

  public data: any[] = [];

  public loading = false;


  public constructor(
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
  ) {
  }

  public ngOnInit(): void {
    this.initTranslations();
    this.initSearch();
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

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('recentChanges.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.listColumns = [
          {
            cellTemplate: this.dateCellTemplate,
            name: column.date,
            key: 'date',
          },
        ];
      });
  }


  public onToggleExpanded(row: RecentChanges): void {
    row.expanded = !row.expanded;
  }

  public parseJSON(value: string): any {
    return JSON.parse(value);
  }

  public formatFieldName(fieldName: string): string {
    return fieldName.split('_').join(' ');
  }

  public isTrashedOrRestored(changesetType: string): boolean {
    return ['R', 'S'].includes(changesetType);
  }

  public isStandardField(contentTypeModel: string, fieldName: string): boolean {
    return (
      !this.isHtmlField(fieldName) &&
      !this.isLabBookChildElementsField(fieldName) &&
      !this.isDateTimeField(fieldName) &&
      !this.isFileSizeField(fieldName) &&
      !this.isUserField(fieldName)
    );
  }

  public isHtmlField(fieldName: string): boolean {
    return ['html_content', 'description', 'content', 'text', 'notes'].includes(fieldName);
  }


  public isLabBookChildElementsField(fieldName: string): boolean {
    return fieldName === 'child_elements';
  }

  public isDateTimeField(fieldName: string): boolean {
    return ['start_date', 'date_time_start', 'end_date', 'due_date', 'stop_date', 'date_time_end'].includes(fieldName);
  }

  public isFileSizeField(fieldName: string): boolean {
    return fieldName === 'file_size';
  }

  public isUserField(fieldName: string): boolean {
    return ['attending_users', 'assigned_users', 'responsible_users'].includes(fieldName);
  }


}
