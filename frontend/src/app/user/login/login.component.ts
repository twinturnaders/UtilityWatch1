
import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import {Router, RouterLink} from '@angular/router';
import {NgClass, NgIf} from '@angular/common';
import {HomeButtonComponent} from '../../shared/home-button/home-button.component';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    NgIf,
    RouterLink,

    NgClass
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loading = false;
  error: string | null = null;
  fieldTextType: boolean = false;
  form!: FormGroup;
  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

  }




  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }
  submit() {
    if (this.form.invalid) return;
    this.loading = true; this.error = null;
    this.auth.login(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/user-account']),
      error: (e) => { this.error = e?.error?.message || 'Login failed'; this.loading = false; }
    });
  }
}
