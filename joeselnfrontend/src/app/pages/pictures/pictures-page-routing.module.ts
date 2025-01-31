import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {
  PicturePageComponent
} from './components/picture-page/picture-page.component';
import {
  PicturesPageComponent
} from './components/pictures-page/pictures-page.component';
import {AuthGuard} from "@app/services";

const routes: Routes = [
  {
    path: '',
    component: PicturesPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':id',
    component: PicturePageComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PicturesPageRoutingModule {
}
