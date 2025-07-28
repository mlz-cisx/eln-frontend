import { Component } from '@angular/core';
import { DefaultControlErrorComponent } from '@ngneat/error-tailor';

@Component({
  templateUrl: './control-error.component.html',
  styleUrls: ['./control-error.component.scss'],
})
export class CustomControlErrorComponent extends DefaultControlErrorComponent {}
