import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../shared/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    const url: string = state.url;
    return this.checkLogin(url);
  }

  constructor(
    private router: Router,
  ) { }

  checkLogin(url: string): boolean {
    let response = false;
    if (localStorage.getItem('user') !== null) {
      response = true;
    } else {
      this.router.navigate(['/sign-in']);
    }
    return response;
  }
  
}
