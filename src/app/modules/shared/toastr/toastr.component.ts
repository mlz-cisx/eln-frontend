import { Component } from '@angular/core';
import { Toast } from 'ngx-toastr';

@Component({
  selector: '[custom-toastr]',
  templateUrl: './toastr.component.html',
  styleUrls: ['./toastr.component.scss'],
})
export class CustomToastComponent extends Toast {}
