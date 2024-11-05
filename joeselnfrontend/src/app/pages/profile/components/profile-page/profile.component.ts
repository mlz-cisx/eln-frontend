import {Component, OnInit} from '@angular/core';
import {UserService} from "@app/services";
import {User, Test} from "@joeseln/types";
import {UserStore} from "@app/services/user/user.store";
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ChangeDetectorRef } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { ToastrService } from 'ngx-toastr';

@UntilDestroy()
@Component({
  selector: 'joeseln-profile-page',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})

export class ProfilePageComponent implements OnInit {
  test: Test[] = []
  user: User | undefined;
  public loading = false;

  public form = this.fb.group(
    {
      password: [null, [Validators.required, Validators.minLength(8)]],
      passwordConfirm: [null, [Validators.required, Validators.minLength(8)]],
    },
    {validators: [this.MustMatch('password', 'passwordConfirm')]}
  );


  constructor(private user_service: UserService,
              private readonly userStore: UserStore,
              private readonly fb: FormBuilder,
              private readonly cdr: ChangeDetectorRef,
              private readonly translocoService: TranslocoService,
              private readonly toastrService: ToastrService,
  ) {
  }

  ngOnInit(): void {
    this.getUserMe();
  }

  getUserMe(): void {
    this.user_service.getUserMe()
      .subscribe(user => {
          this.user = user
          this.userStore.update(() => ({user, loggedIn: Boolean(user)}));
        }
      );
  }

  private get f(): FormGroup['controls'] {
    return this.form.controls;
  }

  MustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (matchingControl.errors && !matchingControl.errors['mustmatch']) {
        return;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({mustmatch: true});
        return;
      }

      matchingControl.setErrors(null);
    };
  }

    public onSubmit(): void {
    if (this.loading || this.form.invalid) {
      return;
    }
    this.loading = true;

    this.user_service
      .changePassword(this.f['password'].value)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.loading = false;
          this.form.reset();
          this.form.clearValidators();
          Object.keys(this.form.controls).forEach(key => {
            this.form.controls[key].setErrors(null);
          });

          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('changePassword.success.toastr.passwordChanged')
            .pipe(untilDestroyed(this))
            .subscribe(passwordChanged => {
              this.toastrService.success(passwordChanged);
            });
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

}
