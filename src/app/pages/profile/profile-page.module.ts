import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { UserModule } from '@app/modules/user/user.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@joeseln/forms';
import { IconsModule } from '@joeseln/icons';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@jsverse/transloco';
import { AlertModule } from 'ngx-bootstrap/alert';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ProfilePageComponent } from './components/profile-page/profile.component';
import { ProfilePageRoutingModule } from './profile-page-routing.module';

@NgModule({
  declarations: [ProfilePageComponent],
  imports: [
    CommonModule,
    ProfilePageRoutingModule,
    TranslocoRootModule,
    FormsModule,
    ErrorTailorModule.forRoot({
      errors: {
        useFactory(translocoService: TranslocoService) {
          return {
            required: () => translocoService.translate('form.errors.required'),
            minlength: ({ requiredLength, actualLength }) =>
              translocoService.translate('form.errors.minlength', { requiredLength, actualLength }),
            mustmatch: () => translocoService.translate('form.errors.mustmatch'),
          };
        },
        deps: [TranslocoService],
      },
      controlErrorComponent: CustomControlErrorComponent,
    }),
    FormHelperModule,
    AlertModule,
    IconsModule,
    UserModule,
    TooltipModule.forRoot(),
  ],
})
export class ProfilePageModule {}
