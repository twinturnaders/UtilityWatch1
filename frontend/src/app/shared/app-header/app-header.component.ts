import {booleanAttribute, Component, EventEmitter, Input, Output} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.css']

})
export class SiteHeaderComponent {
  @Input({transform: booleanAttribute}) isAuthed = false;
  @Output() logout = new EventEmitter<void>();
  menuOpen = false;
  closeMenu() { this.menuOpen = false; }
}
