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
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {cloneDeep} from 'lodash';
import { map } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'mlzeln-recent-changes',
  templateUrl: './recent-changes.component.html',
  styleUrls: ['./recent-changes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  public listColumns: TableColumn[] = [];

  public data: any[] = [];

  public loading = false;


  public constructor(
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef
  ) {
  }

  public ngOnInit(): void {
    this.initTranslations();
    this.getChanges();

    this.refresh?.pipe(untilDestroyed(this)).subscribe(() => {
      this.getChanges();
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

  public getChanges(): void {

    if (this.loading) {
      return;
    }
    this.loading = true;
    this.service?.history(this.changesId).pipe(
      untilDestroyed(this),
      map((recentChanges: RecentChanges[]) => {
        const changes: RecentChanges[] = [];
        let changeRecords: RecentChangesChangeRecord[];

        recentChanges.forEach(change => {
          changeRecords = [];

          change.change_records.forEach(record => {
            if (record.field_name === 'metadata') {
              const oldValue = record.old_value ? this.parseJSON(cloneDeep(record.old_value)) : [];
              const newValue = record.new_value ? this.parseJSON(cloneDeep(record.new_value)) : [];

              changeRecords.push({
                field_name: record.field_name,
                old_value: oldValue.filter(
                  (oldField: any) =>
                    !newValue.some(
                      (newField: any) =>
                        oldField.pk === newField.pk && oldField.fields?.values?.value === newField.fields?.values?.value
                    )
                ),
                new_value: newValue.filter(
                  (newField: any) =>
                    !oldValue.some(
                      (oldField: any) =>
                        newField.pk === oldField.pk && newField.fields?.values?.value === oldField.fields?.values?.value
                    )
                ),
              });
            } else {
              changeRecords.push({...record});
            }
          });

          changes.push({
            ...change,
            change_records: [...changeRecords],
          });
        });

        this.data = changes;
      })
    )
      //   )
      // )
      .subscribe(
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );

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
