import { Component } from '@angular/core';
import { ModalController, NavController } from '@ionic/angular';
import { GameService } from 'src/app/services/game-service';

@Component({
  selector: 'app-join-room',
  templateUrl: './join-room.component.html',
})
export class JoinRoomComponent {

  username: string = '';
  roomId: string = '';
  error: string = '';

  constructor(
    private modalCtrl: ModalController,
    private gameService: GameService,
    private navCtrl: NavController
  ) {}

  async join() {
    this.error = '';

    if (!this.username || !this.roomId) {
      this.error = 'Tous les champs sont requis';
      return;
    }

    const result = await this.gameService.joinRoom(this.roomId, this.username);

    if (!result.success) {
      this.error = result.message || 'Erreur';
      return;
    }

    // fermer la modal
    await this.modalCtrl.dismiss();

    // ✅ redirection correcte
    this.navCtrl.navigateForward(`/game-room/${this.roomId}?username=${this.username}`);
  }

  close() {
    this.modalCtrl.dismiss();
  }
}