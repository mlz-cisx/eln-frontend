import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'eworkbench-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingComponent {
  @Input()
  public loading = false;
}
