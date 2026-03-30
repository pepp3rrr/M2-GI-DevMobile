import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { Room } from '../../models/room';
import { GameService } from '../../services/game-service';
import { IonButton, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonFab, IonFabButton, IonIcon, ModalController } from '@ionic/angular/standalone';
import { AsyncPipe, NgClass } from '@angular/common';
import { GameQuestion } from 'src/app/models/gameQuestion';
import { user, Auth } from '@angular/fire/auth';
import { GameResult } from 'src/app/models/gameResult';
import { Player } from 'src/app/models/player';

@Component({
  selector: 'app-game-room',
  templateUrl: './game-page.component.html',
  styleUrls: ['./game-page.component.scss'],
  imports: [
    IonContent,
    AsyncPipe,
    NgClass,
    IonButton
  ]
})
export class GameRoomPage implements OnInit {

  roomId!: string;
  userId!: string;

  game_status: string = 'waiting';
  question: GameQuestion = {
    index: -1,
    text: '',
    choices: []
  };
  selectedAnswerId: string | null = null;
  correctAnswerId: string | null = null;
  globalScores: GameResult[] = [];

  room$!: Observable<Room | null>;
  players$!: Observable<Player[]>;

  constructor(
    private route: ActivatedRoute,
    private gameService: GameService,
    private auth: Auth
  ) {}

  async ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('id')!;

    const currentUser = await firstValueFrom(user(this.auth));
    if (!currentUser) { 
      throw new Error('User not authenticated');
    }
    this.userId = currentUser.uid;

    this.room$ = this.gameService.watchRoom(this.roomId);
    this.players$ = this.gameService.watchPlayers(this.roomId);

    // écoute des changements
    this.room$.subscribe(room => {
      console.dir(room, {depth: null});
      if (!room) return;

      if(room.status === this.game_status) return; // pas de nouvel événement
      this.game_status = room.status;

      console.log('New event received:', room);

      switch(room.status) {
        case 'waiting':
          break;
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
  selectAnswer(choiceId: string) {
    console.log('Answer selected:', choiceId, "Current game status:", this.game_status);
    if (this.game_status !== 'question_send') return;

    this.selectedAnswerId = choiceId;
    
    this.gameService.submitAnswer(
      this.roomId,
      this.userId,
      choiceId,
      this.question!.index
    );
  }

  exitGame() {
    window.location.href = '/';
  }
}