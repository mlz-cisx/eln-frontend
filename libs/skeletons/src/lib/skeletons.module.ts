import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SidebarSkeletonComponent } from './components/sidebar/sidebar.component';
import { LabbookSkeletonComponent } from './components/labbook/labbook.component';


@NgModule({
  declarations: [
    SidebarSkeletonComponent,
    LabbookSkeletonComponent,
  ],
  imports: [CommonModule],
  exports: [
    SidebarSkeletonComponent,
    LabbookSkeletonComponent,
  ],
})
export class SkeletonsModule {}
