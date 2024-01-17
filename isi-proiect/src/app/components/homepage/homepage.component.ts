import { Component, OnInit } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {
  router: any;
  userDisplayName: string | null = null;

  constructor(public authService: AuthService,) { }

  async ngOnInit(): Promise<void> {
    this.userDisplayName = await this.authService.getUserDisplayName();
    console.log(this.userDisplayName);
  }

  signOut() {    
    this.authService.SignOut();
  }

}
