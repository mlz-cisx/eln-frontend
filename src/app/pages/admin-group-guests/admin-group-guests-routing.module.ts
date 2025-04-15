import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {AuthGuard} from "@app/services";
import {
  GroupGuestsComponent
} from "@app/pages/admin-group-guests/components/admin-group-guests/group-guests.component";


const routes: Routes = [
  {
    path: '',
    component: GroupGuestsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':id',
    component: GroupGuestsComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminGroupGuestsRoutingModule {
}
