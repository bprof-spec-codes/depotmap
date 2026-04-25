import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-content-card',
  standalone: false,
  templateUrl: './content-card.html',
  styleUrl: './content-card.scss',
})
export class ContentCard {

  @Input() title = '';
  @Input() soft = false;
  @Input() hasActions = false;
}
