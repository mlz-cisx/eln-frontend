import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CommonModule} from "@angular/common";


const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('@app/pages/landing-page/landing-page.module').then(m => m.LandingPageModule),
  },
  {
    path: 'labbooks',
    loadChildren: () => import('@app/pages/labbooks/labbooks-page.module').then(m => m.LabBooksPageModule),
  },
  {
    path: 'login',
    loadChildren: () => import('@app/pages/login/login-page.module').then(m => m.LoginPageModule),
  },
  {
    path: 'profile',
    loadChildren: () => import('@app/pages/profile/profile-page.module').then(m => m.ProfilePageModule),
  },
  {
    path: 'notes',
    loadChildren: () => import('@app/pages/notes/notes-page.module').then(m => m.NotesPageModule),
  },
  {
    path: 'files',
    loadChildren: () => import('@app/pages/files/files-page.module').then(m => m.FilesPageModule),
  },
  {
    path: 'pictures',
    loadChildren: () => import('@app/pages/pictures/pictures-page.module').then(m => m.PicturesPageModule),
  },
  {path: '404', redirectTo: '/'},
  {path: '**', redirectTo: '/'}

];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forRoot(routes, {}),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
