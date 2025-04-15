import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormHelperModule} from '@app/modules/form-helper/form-helper.module';
import {
  CustomControlErrorComponent
} from '@app/modules/shared/control-error/control-error.component';
import {TranslocoRootModule} from '@app/transloco-root.module';
import {FormsModule} from '@joeseln/forms';
import {ErrorTailorModule} from '@ngneat/error-tailor';
import {TranslocoService} from '@ngneat/transloco';
import {LoginPageComponent} from './components/login-page/login-page.component';
import {LoginPageRoutingModule} from './login-page-routing.module';

@NgModule({
  declarations: [LoginPageComponent],
  imports: [
    CommonModule,
    LoginPageRoutingModule,
    TranslocoRootModule,
    FormsModule,
    FormHelperModule,
    ErrorTailorModule.forRoot({
      errors: {
        useFactory(translocoService: TranslocoService) {
          return {
            required: () => translocoService.translate('form.errors.required'),
            emaildetected: () => translocoService.translate('form.errors.emaildetected'),
          };
        },
        deps: [TranslocoService],
      },
      controlErrorComponent: CustomControlErrorComponent,
    }),
  ],
})
export class LoginPageModule {
}
