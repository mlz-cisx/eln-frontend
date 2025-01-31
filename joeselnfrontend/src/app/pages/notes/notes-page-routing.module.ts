import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {NotePageComponent} from './components/note-page/note-page.component';
import {NotesPageComponent} from './components/notes-page/notes-page.component';
import {AuthGuard} from "@app/services";

const routes: Routes = [
  {
    path: '',
    component: NotesPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':id',
    component: NotePageComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NotesPageRoutingModule {
}
