import { Component, OnInit, inject } from '@angular/core';
import { Quiz } from 'src/app/models/quiz';
import { QuizService } from 'src/app/services/quiz-service';
import { IonButton, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonFab, IonFabButton, IonIcon, ModalController, IonButtons, IonFooter } from '@ionic/angular/standalone';
import { QuizCardComponent } from '../quiz-card/quiz-card.component';
import { CreateQuizModal } from '../modals/create-quiz/create-quiz.modal';
import { addIcons } from 'ionicons';
import {
  add,
  addOutline,
  logOutOutline,
  playOutline,
  enterOutline
} from 'ionicons/icons';

import { JoinRoomComponent } from '../modals/join-room/join-room.component';
import { CreateRoomComponent } from '../modals/create-room/create-room.component';
import { QuizDetailModal } from '../modals/detail-quiz/quiz-detail.modal';
import { AuthService } from 'src/app/services/auth-service';
import { Router } from '@angular/router';

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
    IonIcon,
    IonButton,
    IonButtons,
    IonFooter
],
})


export class HomePageComponent  implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private modalCtrl = inject(ModalController);
  quizzes: Quiz[] | null = null;
  constructor(private quizService: QuizService) {
    addIcons
    ({  add,
        addOutline,
        logOutOutline,
        playOutline,
        enterOutline
     });
  }
  
  ngOnInit() {
    this.quizzes = null;

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

    if (result.data) {
      try {
        const quiz: Quiz = result.data;

        await this.quizService.saveQuiz(quiz);

        console.log('Quiz saved to Firebase:', quiz.id);

      } catch (error) {
        console.error('Error saving quiz:', error);
      }
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

  async openJoinRoomModal() {
    const modal = await this.modalCtrl.create({
      component: JoinRoomComponent
    });
    
    await modal.present();
  }
  async openCreateRoomModal() {
    const modal = await this.modalCtrl.create({
      component: CreateRoomComponent,
      componentProps: {
        quizzes: this.quizzes
      }
    });

    await modal.present();
  }

  async logout() {
    await this.authService.logout();
    this.router.navigateByUrl('/login-page');
  }
}