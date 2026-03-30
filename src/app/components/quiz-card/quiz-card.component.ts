import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Quiz } from 'src/app/models/quiz';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-quiz-card',
  templateUrl: './quiz-card.component.html',
  styleUrls: ['./quiz-card.component.scss'],
  imports: [
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
  ]
})
export class QuizCardComponent {
  
  @Input() quiz!: Quiz;
  

  @Output() quizClick = new EventEmitter<Quiz>();

  onClick() {
    this.quizClick.emit(this.quiz);
  }

  // just a fun way to get a consistent gradient color for each quiz card based on its id
  getSoftColor(id: string): string {
    const colors = ['#a29bfe', '#81ecec', '#fab1a0', '#ffeaa7', '#74b9ff'];

    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }
}
