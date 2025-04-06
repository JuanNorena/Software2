import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  loginForm!: FormGroup;


 constructor(private formBuilder: FormBuilder) { 

  this.crearFormulario();

 }

 private crearFormulario() {
  this.loginForm = this.formBuilder.group({
    usuario: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.maxLength(10), Validators.minLength(7)]],
    rememberUser: [false] // 👈 Este es el campo que faltaba
  });
}
 public login() {
  console.log(this.loginForm.value);
}

onForgotPassword() {
  // Lógica para redirigir a recuperación
}
}


