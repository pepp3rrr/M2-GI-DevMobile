import { Component, Input } from '@angular/core';
import { GameService } from 'src/app/services/game-service';
import { Quiz } from 'src/app/models/quiz';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonList,
  IonItem,
  IonLabel, 
  ModalController,
  NavController,
} from '@ionic/angular/standalone';

import { Auth, user } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-create-room',
  templateUrl: './create-room.component.html',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonList,
    IonItem,
    IonLabel
  ]
})
export class CreateRoomComponent {

  @Input() quizzes: Quiz[] = [];

  selectedQuizId: string | null = null;
  error: string = '';

  constructor(
    private modalCtrl: ModalController,
    private gameService: GameService,
    private navCtrl: NavController,
    private auth: Auth,
  ) {}

  selectQuiz(quizId: string) {
    this.selectedQuizId = quizId;
  }

  async createRoom() {
    this.error = '';

    if (!this.selectedQuizId) {
      this.error = 'Veuillez sélectionner un quiz';
      return;
    }

    const currentUser = await firstValueFrom(user(this.auth));

    if (!currentUser) {
      this.error = 'Utilisateur non connecté';
      return;
    }

    const userId = currentUser.uid;

    const roomId = await this.gameService.createRoom(
      this.selectedQuizId,
      userId
    );

    await this.modalCtrl.dismiss();

    this.navCtrl.navigateForward(`/admin-game-room/${roomId}`);
  }

  close() {
    this.modalCtrl.dismiss();
  }
}