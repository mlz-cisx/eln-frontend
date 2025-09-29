import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
} from '@angular/core';
import {Validators, UntypedFormBuilder, UntypedFormGroup} from '@angular/forms';
import {Title} from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {UserService, AuthService} from "@app/services";
import {environment} from "@environments/environment";


@UntilDestroy()
@Component({
    selector: 'joeseln-login-page',
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class LoginPageComponent implements OnInit {
  public title = '';

  public loading = false;

  public keycloak_integration = environment.keycloak_integration;

  public form!: UntypedFormGroup;


  public constructor(
    private readonly fb: UntypedFormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly auth: AuthService,
    private readonly titleService: Title,
    private user_service: UserService,
  ) {
  }


  public ngOnInit(): void {

    if (this.keycloak_integration && this.route.snapshot.queryParams['token']) {
      this.auth.setDataInLocalStorage('token', this.route.snapshot.queryParams['token'])
      this.router.navigate(['/'])
    }


    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }


  public initPageTitle(): void {

  }


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
    window.location.href = `${environment.apiUrl}/login-keycloak`;
  }

}
