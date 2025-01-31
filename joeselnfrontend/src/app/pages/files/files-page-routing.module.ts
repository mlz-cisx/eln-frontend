import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {FilePageComponent} from './components/file-page/file-page.component';
import {FilesPageComponent} from './components/files-page/files-page.component';
import {AuthGuard} from "@app/services";

const routes: Routes = [
  {
    path: '',
    component: FilesPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':id',
    component: FilePageComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FilesPageRoutingModule {
}
