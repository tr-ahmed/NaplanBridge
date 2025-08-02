import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  phone = '';
  age: number | null = null;
  termsAccepted = false;

  constructor(private authService: AuthService) {}

  onRegister() {
    if (this.name && this.email && this.password && this.phone && this.age !== null) {
      const user = {
        name: this.name,
        email: this.email,
        password: this.password,
        phone: this.phone,
        age: this.age!  // confirm age is not null
      };
      this.authService.register(user);
    } else {
      alert('❗ Please fill in all the fields.');
    }
  }
}
