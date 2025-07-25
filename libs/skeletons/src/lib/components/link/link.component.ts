import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'eworkbench-link-skeleton',
  templateUrl: './link.component.html',
  styleUrls: ['./link.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkSkeletonComponent {}
