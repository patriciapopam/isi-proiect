import { Component, OnInit } from '@angular/core';
import { AuthService } from "../../shared/services/auth.service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FirebaseService } from 'src/app/shared/services/database/firebase.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})

export class SignUpComponent implements OnInit {
  constructor(
    public authService: AuthService,
    public fb: FirebaseService
  ) { }
  
  ngOnInit() { }

  SignUp(email: string, userPwd: string, userDisplayName: string) {
    this.authService.SignUp(email, userPwd).then((result) => {
      console.log((result as any)?.uid);
    }).catch((error) => {
      window.alert(error.message);
    });
    //this.fb.addUserToDatabase(email, userDisplayName);
  }
}