import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
} from '@angular/core';
import {Validators, UntypedFormBuilder, UntypedFormGroup} from '@angular/forms';
import {Title} from '@angular/platform-browser';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {UserService} from "@app/services";
import {KeycloakService} from 'keycloak-angular';
import {environment} from "@environments/environment";


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


  public form!: UntypedFormGroup;


  public constructor(
    private readonly fb: UntypedFormBuilder,
    private readonly titleService: Title,
    private user_service: UserService,
    public keycloak: KeycloakService,
  ) {
  }


  public ngOnInit(): void {


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
    this.keycloak.login({
      redirectUri: window.location.origin,
    });
  }

}
