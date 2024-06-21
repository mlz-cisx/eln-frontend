import {Injectable} from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor() {
  }

  getUserDetails() {
    // @ts-ignore
    return localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
  }

  setDataInLocalStorage(variableName: string, data: string): void {
    localStorage.setItem(variableName, data);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  clearStorage() {
    localStorage.clear();
  }

}
