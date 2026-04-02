import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
  isActive = false;

  loginData = { email: '', password: '' };
  signupData = { name: '', email: '', password: '', confirm: '', provider: 'LOCAL' };

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    if (typeof window === 'undefined') return;
    // Handle Google OAuth redirect with ?token=
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      this.authService.saveToken(token);
      this.router.navigate(['/dashboard']);
      return;
    }
    // Already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  toggle() {
    this.isActive = !this.isActive;
  }

  signup() {
    const { name, email, password, confirm } = this.signupData;
    if (!name || !email || !password || !confirm) {
      alert('Fill all fields');
      return;
    }
    if (password !== confirm) {
      alert('Passwords do not match!');
      return;
    }
    this.authService
      .register({ name, email, password, provider: 'LOCAL' })
      .subscribe({
        next: (res) => {
          this.authService.saveToken(res.token);
          alert('Signup Success 🎉');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          alert('Signup failed ❌ ' + (err.error?.message || ''));
        }
      });
  }

  login() {
    const { email, password } = this.loginData;
    if (!email || !password) {
      alert('Enter email & password');
      return;
    }
    this.authService.login({ email, password }).subscribe({
      next: (res) => {
        this.authService.saveToken(res.token);
        alert('Login Success ✅');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        alert('Invalid credentials ❌ ' + (err.error?.message || ''));
      }
    });
  }

  googleLogin() {
    this.authService.googleLogin();
  }
}