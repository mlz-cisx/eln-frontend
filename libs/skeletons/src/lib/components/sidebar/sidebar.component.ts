import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'eworkbench-sidebar-skeleton',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarSkeletonComponent {}
