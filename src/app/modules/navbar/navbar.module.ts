import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NavbarComponent} from './components/navbar/navbar.component';
import {
  GlobalSearchComponent
} from "@app/modules/navbar/components/global-search/global-search.component";
import {RouterModule} from "@angular/router";
import {IconsModule} from "@joeseln/icons";
import { UserModule } from '@app/modules/user/user.module';
import {LoadingModule} from "@app/modules/loading/loading.module";
import {BsDropdownModule} from "ngx-bootstrap/dropdown";
import {SharedModule} from "@app/modules/shared/shared.module";
import { FormsModule } from '@joeseln/forms';
import {TranslocoRootModule} from "@app/transloco-root.module";


@NgModule({
  declarations: [
    NavbarComponent,
    GlobalSearchComponent
  ],
  exports: [
    NavbarComponent,
    GlobalSearchComponent
  ],
  imports: [
    CommonModule,
    IconsModule,
    RouterModule,
    UserModule,
    LoadingModule,
    BsDropdownModule,
    SharedModule,
    FormsModule,
    TranslocoRootModule,
  ]
})
export class NavbarModule {
}
