//imports for Angular core functionality and form handling
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

//main component decorator with metadata
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    ReactiveFormsModule
  ]
})

//main LoginPage class implementation
export class LoginPage implements OnInit {
  //form group for authentication
  authForm: FormGroup;
  //toggle between login and signup modes
  isLogin = true;

  //initializes the LoginPage component with required services
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    //initialize form with validation rules
    this.authForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      username: ['']
    });
  }

  //lifecycle hook for component initialization
  ngOnInit() {}

  //toggles between login and signup modes
  toggleAuthMode() {
    this.isLogin = !this.isLogin;
    if (!this.isLogin) {
      //add username validation for signup
      this.authForm.get('username')?.setValidators([Validators.required]);
    } else {
      //remove username validation for login
      this.authForm.get('username')?.clearValidators();
    }
    this.authForm.get('username')?.updateValueAndValidity();
  }

  //handles form submission for both login and signup
  async onSubmit() {
    if (this.authForm.valid) {
      try {
        if (this.isLogin) {
          //handle login
          await this.authService.authenticateUser({
            email: this.authForm.value.email,
            password: this.authForm.value.password
          });
        } else {
          //handle signup
          await this.authService.registerUser({
            email: this.authForm.value.email,
            password: this.authForm.value.password,
            username: this.authForm.value.username
          });
        }
        this.router.navigate(['/home']);
      } catch (error: any) {
        //display error message if authentication fails
        const toast = await this.toastController.create({
          message: error.message,
          duration: 2000,
          color: 'danger'
        });
        toast.present();
      }
    }
  }
}