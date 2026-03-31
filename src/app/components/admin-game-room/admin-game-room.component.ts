import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonList, IonItem, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { GameService } from 'src/app/services/game-service';
import { Room } from 'src/app/models/room';
import { Observable } from 'rxjs';
import { AsyncPipe, NgClass } from '@angular/common';
import { Player } from 'src/app/models/player';
import { GameQuestion } from 'src/app/models/gameQuestion';
import { GameResult } from 'src/app/models/gameResult';
import { QRCodeComponent } from 'angularx-qrcode';
import { addIcons } from 'ionicons';
import {
  triangle,
  square,
  ellipse,
  diamond
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-game-room',
  templateUrl: './admin-game-room.component.html',
  styleUrl: './admin-game-room.component.scss',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    AsyncPipe,
    NgClass,
    QRCodeComponent,
    IonIcon
  ]
})
export class AdminGameRoomComponent implements OnInit {

  roomId!: string;
  room$!: Observable<Room | null>;
  players$!: Observable<Player[]>;

  globalScores: GameResult[] = [];
  correctAnswerId: string | null = null;

  isLastQuestion: boolean = false;

  game_status: string = 'waiting';

  question: GameQuestion = {
    index: -1,
    text: '',
    choices: []
  }
  // correctAnswerId: string | null = null;
  qrCodeUrl: string = '';

  constructor(
    private route: ActivatedRoute,
    private gameService: GameService
  ) {
    addIcons({
      triangle,
      square,
      ellipse,
      diamond
    });
  }

  ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('id')!;
    // this.qrCodeUrl = `${window.location.origin}/qrcode/${this.roomId}`;
    this.qrCodeUrl = `https://pepp3rrr.github.io/M2-GI-DevMobile/qrcode/${this.roomId}`;

    this.room$ = this.gameService.watchRoom(this.roomId);
    this.players$ = this.gameService.watchPlayers(this.roomId);

    this.room$.subscribe(room => {
      if (!room) return;

      if (room.status === this.game_status) return;
      this.game_status = room.status;

      switch (room.status) {
        case 'question_send':
          this.gameService.getNextQuestion(room.currentQuestionIndex, room.quizId)
            .then(question => {
              this.question = question;
            })
            .catch(error => {
              console.error('Error fetching next question:', error);
            });
          break;
        case 'show_answer':
          this.gameService.getCorrectAnswerId(room.currentQuestionIndex, room.quizId)
            .then(correctAnswerId => {
              this.correctAnswerId = correctAnswerId;
            })
            .catch(error => {
              console.error('Error fetching correct answer ID:', error);
            });
          this.gameService.getResponseCounts(this.roomId).then(gameQuestion => {
            if (gameQuestion) {
              this.question = gameQuestion;
            }
          }).catch(error => {
            console.error('Error fetching response counts:', error);
          });
          break;
        case 'show_score':
          this.gameService.getGlobalScores(this.roomId).then(globalScores => {
            this.globalScores = (globalScores || []).sort((a, b) => b.score - a.score);
          }).catch(error => {
            console.error('Error fetching global scores:', error);
          });
          break;
        default:
          console.log('Unknown event type:', room.status);
          break;
      }
    });
  }

  async startGame() {
    const result = await this.gameService.startGame(this.roomId);
    if (result.success && result.isLastQuestion) {
      this.isLastQuestion = true;
    }
  }
  async nextQuestion() {
    const result = await this.gameService.nextQuestion(this.roomId);
    if (result.success && result.isLastQuestion) {
      this.isLastQuestion = true;
    }
  }

  async getAnswers() {
    const result = await this.gameService.getAnswers(this.roomId);
    if (result.message) {
      console.log(result.message);
    }
  }

  async gameResults() {
    const result = await this.gameService.showResults(this.roomId);
    if (result.message) {
      console.log(result.message);
    }
  }

  async closeRoom() {
    await this.gameService.closeRoom(this.roomId);
    window.location.href = '/';
  }

  getIcon(index: number): string {
    const icons = [
      'triangle',
      'square',
      'ellipse',
      'diamond'
    ];
    return icons[index] || 'help';
  }
}