import { Component, Input } from '@angular/core';
import { ModalController, NavController } from '@ionic/angular';
import { GameService } from 'src/app/services/game-service';
import { Quiz } from 'src/app/models/quiz';

@Component({
  selector: 'app-create-room',
  templateUrl: './create-room.component.html',
})
export class CreateRoomComponent {

  @Input() quizzes: Quiz[] = [];

  selectedQuizId: string | null = null;
  error: string = '';

  constructor(
    private modalCtrl: ModalController,
    private gameService: GameService,
    private navCtrl: NavController
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
    const quiz = this.quizzes.find(q => q.id === this.selectedQuizId);

    if (!quiz) {
      this.error = 'Quiz introuvable';
      return;
    }
    const roomId = await this.gameService.createRoom(quiz);

    await this.modalCtrl.dismiss({ roomId });
  }

  close() {
    this.modalCtrl.dismiss();
  }
}