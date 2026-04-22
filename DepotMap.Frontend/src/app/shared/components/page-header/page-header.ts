import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: false,
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
})
export class PageHeader {

  @Input() title = '';
  @Input() subtitle = '';
  @Input() hasActions = false;
}
