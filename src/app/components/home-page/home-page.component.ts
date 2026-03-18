import { Component, OnInit, inject } from '@angular/core';
import { Quiz } from 'src/app/models/quiz';
import { QuizService } from 'src/app/services/quizService';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonFab, IonFabButton, IonIcon, ModalController } from '@ionic/angular/standalone';
import { QuizCardComponent } from '../quiz-card/quiz-card.component';
import { CreateQuizModal } from '../modals/create-quiz.modal';
import { add } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { QuizDetailModal } from '../modals/quiz-detail.modal';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    QuizCardComponent,
    IonFab,
    IonFabButton,
    IonIcon
],
})


export class HomePageComponent  implements OnInit {
  
  private modalCtrl = inject(ModalController);
  quizzes: Quiz[] = [];
  private itemsPerLine = 4;
  private lines: Array<number> = [];
  constructor(private quizService: QuizService) {
    addIcons({ add });
  }
  
  ngOnInit() {
    this.quizService.getAll().subscribe((quizzes) => {
      this.quizzes = quizzes;
    });
  }

  async createQuiz() {

    const modal = await this.modalCtrl.create({
      component: CreateQuizModal
    });

    await modal.present();

    const result = await modal.onDidDismiss();

    if(result.data) {
      console.log("Created quiz:", result.data);
    }
  }


  async openQuiz(quiz: Quiz) {
    try {
      const modal = await this.modalCtrl.create({
        component: QuizDetailModal,
        componentProps: { quiz }
      });

      await modal.present();

    } catch (error) {
      console.error('Modal error:', error);
    }
  }

  // For debug
  async addTestQuiz() {
    const testQuiz: Quiz = {
      id: '',
      title: 'Math & General Knowledge',
      description: 'A simple test quiz with two questions',
      questions: [
        {
          id: '',
          text: 'What is 2 + 2?',
          choices: [
            { id: 'a', text: '3' },
            { id: 'b', text: '4' },
            { id: 'c', text: '5' }
          ],
          correctChoiceId: 'b'
        },
        {
          id: '',
          text: 'What is the capital of France?',
          choices: [
            { id: 'a', text: 'Berlin' },
            { id: 'b', text: 'Madrid' },
            { id: 'c', text: 'Paris' }
          ],
          correctChoiceId: 'c'
        }
      ]
    };

    try {
      const id = await this.quizService.addQuiz(testQuiz);
      console.log('Test quiz created with ID:', id);
    } catch (error) {
      console.error('Error creating test quiz:', error);
    }
  }
}