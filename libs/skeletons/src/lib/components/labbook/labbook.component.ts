import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'eworkbench-labbook-skeleton',
  templateUrl: './labbook.component.html',
  styleUrls: ['./labbook.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabbookSkeletonComponent {}
