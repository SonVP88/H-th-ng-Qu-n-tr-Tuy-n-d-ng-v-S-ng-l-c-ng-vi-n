import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-hr-layout',
  standalone: true,
  imports: [ CommonModule, RouterOutlet ],
  templateUrl: './hr-layout.html',
  styleUrl: './hr-layout.scss',
})
export class HrLayout {

}
