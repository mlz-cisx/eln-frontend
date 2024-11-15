/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CommentModule } from '@app/modules/comment/comment.module';
import { DetailsDropdownModule } from '@app/modules/details-dropdown/details-dropdown.module';
// import { FavoritesModule } from '@app/modules/favorites/favorites.module';
// import { FileModule } from '@app/modules/file/file.module';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
// import { HeaderModule } from '@app/modules/header/header.module';
// import { LabelModule } from '@app/modules/label/label.module';
// import { LinkModule } from '@app/modules/link/link.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { LockModule } from '@app/modules/lock/lock.module';
import { MetadataModule } from '@app/modules/metadata/metadata.module';
// import { ProjectModule } from '@app/modules/project/project.module';
import { RecentChangesModule } from '@app/modules/recent-changes/recent-changes.module';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { SharedModule } from '@app/modules/shared/shared.module';
// import {StorageModule} from '@app/modules/storage/storage.module';
import { TrashModule } from '@app/modules/trash/trash.module';
import { UserModule } from '@app/modules/user/user.module';
import { VersionsModule } from '@app/modules/versions/versions.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@joeseln/forms';
import { IconsModule } from '@joeseln/icons';
import { ModalsModule } from '@joeseln/modals';
import { SkeletonsModule } from '@joeseln/skeletons';
import { TableModule } from '@joeseln/table';
import { WysiwygEditorModule } from '@joeseln/wysiwyg-editor';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@ngneat/transloco';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { AdminPageComponent } from './components/admin-page/admin-page.component';
import {UsersPageComponent} from "@app/pages/admin/components/admin-users/users-page.component";
import {UserPageComponent} from "@app/pages/admin/components/admin-user/user-page.component";
import {NewUserModalComponent} from "@app/pages/admin/components/user_modals/new/new.component";
import {
  AdminPageRoutingModule
} from "@app/pages/admin/admin-page-routing.module";


@NgModule({
  declarations: [AdminPageComponent, UsersPageComponent, UserPageComponent, NewUserModalComponent],
  imports: [
    CommonModule,
    AdminPageRoutingModule,
    TranslocoRootModule,
    // HeaderModule,
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
    LockModule,
    FormHelperModule,
    ModalsModule,
    SharedModule,
    DetailsDropdownModule,
    WysiwygEditorModule,
    RecentChangesModule,
    VersionsModule,
    BsDropdownModule.forRoot(),
    MetadataModule,
    // ProjectModule,
    //LabelModule,
    IconsModule,
    // LinkModule,
    SkeletonsModule,
    // StorageModule,
    // FileModule,
    // FavoritesModule,
    CommentModule,
    TooltipModule.forRoot(),
  ],
})
export class AdminPageModule {}
