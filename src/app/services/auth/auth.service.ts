import {Injectable} from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private e = new TextEncoder();
  private d = new TextDecoder();
  constructor() {
  }

  getUserDetails() {
    const encoded = localStorage.getItem('userInfo')?.toString();
    if (encoded) {
      const arr = new Uint8Array(JSON.parse(encoded));
      return JSON.parse(this.d.decode(arr));
    }
    return null;
  }

  storeUserDetails(data: any) {
    const encoded = this.e.encode(JSON.stringify(data));
    localStorage.setItem('userInfo', JSON.stringify(Array.from(encoded)));
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
