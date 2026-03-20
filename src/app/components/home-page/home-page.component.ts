import { Component, OnInit, inject } from '@angular/core';
import { Quiz } from 'src/app/models/quiz';
import { QuizService } from 'src/app/services/quizService';
import { IonButton, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonFab, IonFabButton, IonIcon, ModalController } from '@ionic/angular/standalone';
import { QuizCardComponent } from '../quiz-card/quiz-card.component';
import { CreateQuizModal } from '../modals/create-quiz.modal';
import { add } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { JoinRoomComponent } from '../modals/join-room/join-room.component';
import { CreateRoomComponent } from '../modals/create-room/create-room.component';

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
    IonButton
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
}