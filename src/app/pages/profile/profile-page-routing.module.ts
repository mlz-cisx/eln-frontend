import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {
  ProfilePageComponent
} from './components/profile-page/profile.component';
import {AuthGuard} from "@app/services";


const routes: Routes = [
  {
    path: '',
    component: ProfilePageComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProfilePageRoutingModule {
}
