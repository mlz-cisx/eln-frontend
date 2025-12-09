import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {CommentModule} from '@app/modules/comment/comment.module';
import {
  DetailsDropdownModule
} from '@app/modules/details-dropdown/details-dropdown.module';
import {FormHelperModule} from '@app/modules/form-helper/form-helper.module';
import {LoadingModule} from '@app/modules/loading/loading.module';
import {
  RecentChangesModule
} from '@app/modules/recent-changes/recent-changes.module';
import {
  CustomControlErrorComponent
} from '@app/modules/shared/control-error/control-error.component';
import {SharedModule} from '@app/modules/shared/shared.module';
import {TrashModule} from '@app/modules/trash/trash.module';
import {UserModule} from '@app/modules/user/user.module';
import {VersionsModule} from '@app/modules/versions/versions.module';
import {TranslocoRootModule} from '@app/transloco-root.module';
import {FormsModule} from '@joeseln/forms';
import {IconsModule} from '@joeseln/icons';
import {ModalsModule} from '@joeseln/modals';
import {TableModule} from '@joeseln/table';
import {WysiwygEditorModule} from '@joeseln/wysiwyg-editor';
import {ErrorTailorModule} from '@ngneat/error-tailor';
import {TranslocoService} from '@jsverse/transloco';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {AdminPageComponent} from './components/admin-page/admin-page.component';
import {
  UsersPageComponent
} from "@app/pages/admin/components/admin-users/users-page.component";
import {
  UserPageComponent
} from "@app/pages/admin/components/admin-user/user-page.component";
import {
  NewUserModalComponent
} from "@app/pages/admin/components/user_modals/new/new.component";
import {
  AdminPageRoutingModule
} from "@app/pages/admin/admin-page-routing.module";
import {
  ElnadminsPageComponent
} from "@app/pages/admin/components/admin-admins/elnadmins-page.component";
import {
  GroupsPageComponent
} from "@app/pages/admin/components/admin-groups/groups-page.component";
import {
  NewGroupModalComponent
} from "@app/pages/admin/components/group_modals/new/new.component";



@NgModule({
  declarations: [ AdminPageComponent, UsersPageComponent, ElnadminsPageComponent, GroupsPageComponent, UserPageComponent, NewUserModalComponent, NewGroupModalComponent],
  imports: [
    CommonModule,
    AdminPageRoutingModule,
    TranslocoRootModule,
    TableModule,
    FormsModule,
    ErrorTailorModule.forRoot({
      errors: {
        useFactory(translocoService: TranslocoService) {
          return {
            required: () => translocoService.translate('form.errors.required'),
          };
        },
        deps: [TranslocoService],
      },
      controlErrorComponent: CustomControlErrorComponent,
    }),
    TrashModule,
    UserModule,
    LoadingModule,
    FormHelperModule,
    ModalsModule,
    SharedModule,
    DetailsDropdownModule,
    WysiwygEditorModule,
    RecentChangesModule,
    VersionsModule,
    BsDropdownModule.forRoot(),
    IconsModule,
    CommentModule,
    TooltipModule.forRoot(),
  ],
})
export class AdminPageModule {}
