import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import { CommentModule } from '@app/modules/comment/comment.module';
import {
  DetailsDropdownModule
} from '@app/modules/details-dropdown/details-dropdown.module';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { LabBookModule } from '@app/modules/labbook/labbook.module';
import {LoadingModule} from '@app/modules/loading/loading.module';
import { RecentChangesModule } from '@app/modules/recent-changes/recent-changes.module';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import {SharedModule} from '@app/modules/shared/shared.module';
import {TrashModule} from '@app/modules/trash/trash.module';
import { UserModule } from '@app/modules/user/user.module';
import { VersionsModule } from '@app/modules/versions/versions.module';
import {TranslocoRootModule} from '@app/transloco-root.module';
import {FormsModule} from '@joeseln/forms';
import {IconsModule} from '@joeseln/icons';
import {ModalsModule} from '@joeseln/modals';
import {TableModule} from '@joeseln/table';
import { WysiwygEditorModule } from '@joeseln/wysiwyg-editor';
import {ErrorTailorModule} from '@ngneat/error-tailor';
import {TranslocoService} from '@ngneat/transloco';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {
  LabBookPageComponent
} from './components/labbook-page/labbook-page.component';
import {
  LabBooksPageComponent
} from './components/labbooks-page/labbooks-page.component';
import {NewLabBookModalComponent} from './components/modals/new/new.component';
import {
  UploadLabBookModalComponent
} from './components/modals/upload/new.component';
import {
  NewQRcodeModalComponent
} from "@app/pages/labbooks/components/modals/qrcode/qr_code";
import {LabBooksPageRoutingModule} from './labbooks-page-routing.module';
import { QRCodeModule } from 'angularx-qrcode';
import {NavbarModule} from "@app/modules/navbar/navbar.module";


@NgModule({
  declarations: [LabBooksPageComponent, NewLabBookModalComponent,
    UploadLabBookModalComponent, LabBookPageComponent, NewQRcodeModalComponent],
  imports: [
    CommonModule,
    LabBooksPageRoutingModule,
    TranslocoRootModule,
    FormsModule,
    FormHelperModule,
    ModalsModule,
    TableModule,
    TrashModule,
    UserModule,
    LoadingModule,
    SharedModule,
    RecentChangesModule,
    DetailsDropdownModule,
    WysiwygEditorModule,
    VersionsModule,
    LabBookModule,
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
    IconsModule,
    CommentModule,
    TooltipModule.forRoot(),
    QRCodeModule,
    NavbarModule
  ],
})
export class LabBooksPageModule {
}
