/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import {Validators, UntypedFormBuilder, UntypedFormGroup} from '@angular/forms';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, Router, RouterStateSnapshot} from '@angular/router';
// import { AuthService, PageTitleService } from '@app/services';
// import type { UserState } from '@app/stores/user';
// import { EmailDetected } from '@app/validators/email-detected.validator';
// import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {map, take} from 'rxjs/operators';
import {UserService} from "@app/services";
import {AuthService} from "@app/services";
import {KeycloakService} from 'keycloak-angular';
import {environment} from "@environments/environment";


// interface FormLogin {
//   username: FormControl<string | null>;
//   password: FormControl<string | null>;
// }

@UntilDestroy()
@Component({
  selector: 'joeseln-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent implements OnInit {
  public title = '';

  public loading = false;

  public keycloak_integration = environment.keycloak_integration;

  // public form = this.fb.group<FormLogin>({
  //   username: this.fb.control(null, [Validators.required]),
  //   password: this.fb.control(null, Validators.required),
  // });

  // public form = this.fb.group<FormLogin>({
  //   username: this.fb.control(null, [Validators.required]),
  //   password: this.fb.control(null, Validators.required),
  // });

  public form!: UntypedFormGroup;

  private returnUrl = '/';

  public constructor(
    // private readonly route: ActivatedRoute,
    // private readonly router: Router,
    private readonly fb: UntypedFormBuilder,
    // private readonly authService: AuthService,
    // private readonly translocoService: TranslocoService,
    // private readonly cdr: ChangeDetectorRef,
    // private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title,
    private user_service: UserService,
    public keycloak: KeycloakService,
  ) {
  }

  // public get f() {
  //   return this.form.controls;
  // }

  public ngOnInit(): void {

    // this.authService.user$.pipe(
    //   untilDestroyed(this),
    //   take(1),
    //   map((user: UserState) => {
    //     if (user.loggedIn) {
    //       void this.router.navigate(['/']);
    //     }
    //   })
    // );


    // this.initTranslations();
    // this.initPageTitle();
    // void this.pageTitleService.set(this.title);

    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  // public initTranslations(): void {
  //   this.translocoService
  //     .selectTranslate('login.title')
  //     .pipe(untilDestroyed(this))
  //     .subscribe(title => {
  //       this.title = title;
  //       // void this.pageTitleService.set(title);
  //     });
  // }

  public initPageTitle(): void {
    // this.pageTitleService
    //   .get()
    //   .pipe(untilDestroyed(this))
    //   .subscribe(title => {
    //     this.titleService.setTitle(title);
    //   });
  }

  // public onLogin(): void {
  //   if (this.loading || this.form.invalid) {
  //     return;
  //   }
  //   this.loading = true;
  //
  //   // this.authService
  //   //   .login(this.f.username.value!, this.f.password.value!)
  //   //   .pipe(untilDestroyed(this))
  //   //   .subscribe(
  //   //     () => {
  //   //       void this.router.navigate([this.returnUrl]);
  //   //     },
  //   //     () => {
  //   //       this.loading = false;
  //   //       this.cdr.markForCheck();
  //   //     }
  //   //   );
  // }

  public login() {
    // @ts-ignore
    let b = this.form.value
    b['grant_type'] = ''
    b['scopes'] = ''
    b['client_secret'] = ''
    b['client_id'] = ''
    this.user_service.login(b)
  }

  public login_with_oidc() {
    this.keycloak.login({
      redirectUri: window.location.origin,
    });
  }

}
