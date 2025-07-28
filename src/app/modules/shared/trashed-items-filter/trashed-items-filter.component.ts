import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-trashed-items-filter',
  templateUrl: './trashed-items-filter.component.html',
  styleUrls: ['./trashed-items-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrashedItemsFilterComponent {

  @Input()
  public filterTextLeft: string = '';
  @Input()
  public filterTextRight: string = '';

  @Output()
  public stateChanged = new EventEmitter<boolean>();

  public showTrashedItems = false;

  public constructor(private readonly cdr: ChangeDetectorRef) {}

  public onChangeState(): void {
    this.showTrashedItems = !this.showTrashedItems;
    this.stateChanged.emit(this.showTrashedItems);
    this.cdr.markForCheck();
  }
}
