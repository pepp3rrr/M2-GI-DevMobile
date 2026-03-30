import { inject, Injectable } from '@angular/core';
import { Firestore, doc, collection, setDoc, updateDoc, getDoc, docData, collectionData } from '@angular/fire/firestore';
import { Observable, map, tap } from 'rxjs';
import { Quiz } from '../models/quiz';
import { Room } from '../models/room';
import { deleteDoc } from 'firebase/firestore';
import { Question } from '../models/question';
import { QuizService } from './quizService';
import { GameQuestion } from '../models/gameQuestion';

@Injectable({
  providedIn: 'root',
})

export class GameService {
  private firestore = inject(Firestore);

  constructor(
    private quizService: QuizService
  ) { }

  private async getRoom(roomId: string): Promise<Room | null> {
    const roomRef = doc(this.firestore, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    return roomSnap.exists() ? (roomSnap.data() as Room) : null;
  }
  private async updateRoom(room: Partial<Room> & { roomId: string }): Promise<void> {
    const roomRef = doc(this.firestore, 'rooms', room.roomId);
    await updateDoc(roomRef, room);
  }
  private async deleteRoom(roomId: string): Promise<void> {
    const roomRef = doc(this.firestore, 'rooms', roomId);
    await deleteDoc(roomRef);
  }
  private async getQuizWithQuestions(quizId: string): Promise<Quiz | undefined> {
    return await this.quizService.getById(quizId).toPromise();
  }

  watchRoom(roomId: string): Observable<Room | null> {
    const roomRef = doc(this.firestore, 'rooms', roomId);
    return docData(roomRef) as Observable<Room | null>;
  }

  /**
   * Create a new room for the given quiz, and return the room ID. The room is created with status "waiting".
   * 
   * @param quiz 
   * @returns 
   */
  async createRoom(quizId: string, userId: string): Promise<string> {
    const roomRef = doc(collection(this.firestore, 'rooms'));
    const roomId = roomRef.id;

    await setDoc(roomRef, {
      roomId,
      quizId,
      currentQuestionIndex: 0,
      status: 'waiting'
    });

    return roomId;
  }

  async closeRoom(roomId: string): Promise<void> {
    await this.deleteRoom(roomId);
  }

  /**
   * Add a player to the room if the username is not already taken, and if the room exists.
   * 
   * @param roomId 
   * @param playerName 
   * @returns 
   */

  async joinRoom(roomId: string, userId: string) {
    const playerRef = doc(this.firestore, `rooms/${roomId}/players/${userId}`);

    const playerSnap = await getDoc(playerRef);

    if (playerSnap.exists()) {
      return { success: false, message: 'User already in room' };
    }

    await setDoc(playerRef, { 
      userId,
      score: 0,
      latestAnswer: null,
    });

    return { success: true };
  }

  /**
   * Start the game and get the first question of the quiz.
   * 
   * @param roomId 
   * @returns 
   */
  async startGame(roomId: string) {
    const room : Room | null = await this.getRoom(roomId);
    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    await this.updateRoom({
      roomId: room.roomId,
      status: 'question_send',
      currentQuestionIndex: 0
    });

    return { success: true};
  }

  async nextQuestion(roomId: string): Promise<{ success: boolean; message?: string }> {
    const room = await this.getRoom(roomId);
    if (!room) return { success: false, message: 'Room not found' };

    const nextIndex = room.currentQuestionIndex + 1;

    await this.updateRoom({
      roomId,
      currentQuestionIndex: nextIndex,
      status: 'question_send'
    });

    return { success: true };
  }

  public getNextQuestion(questionIndex: number, quizId: string): Promise<GameQuestion> {
    return new Promise((resolve, reject) => {
      this.quizService.getById(quizId).subscribe({
        next: quiz => {
          if (!quiz) return reject(new Error('Quiz not found'));

          const question = quiz.questions[questionIndex];
          if (!question) return reject(new Error('Question not found'));

          resolve({
            index: questionIndex,
            text: question.text,
            choices: question.choices.map(c => ({
              id: c.id,
              text: c.text,
              responseCount: -1
            }))
          } as GameQuestion);
        },
        error: err => reject(err)
      });
    });
  }
  public getCorrectAnswerId(questionIndex: number, quizId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.quizService.getById(quizId).subscribe({
        next: quiz => {
          if (!quiz) return reject(new Error('Quiz not found'));

          const question = quiz.questions[questionIndex];
          if (!question) return reject(new Error('Question not found'));

          resolve(question.correctChoiceId);
        },
        error: err => reject(err)
      });
    });
  }

  /**
   * Fetch all answers for the current question in the room, for all players registered in the room.
   * 
   * @param roomId 
   * @returns 
   */
  async getAnswers(roomId: string) {
    const room = await this.getRoom(roomId);
    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    const quiz = await this.getQuizWithQuestions(room.quizId);
    if (!quiz) {
      return { success: false, message: 'Quiz not found' };
    }

    const currentQuestionIndex = room.currentQuestionIndex;
    const question = quiz.questions[currentQuestionIndex];

    const answers = room.players.map(p => ({
      username: p.username,
      answer: p.answers[currentQuestionIndex] ?? null
    }));

    const counts: Record<string, number> = {};

    question.choices.forEach(choice => { counts[choice.id] = 0; });
    counts['0'] = 0;

    answers.forEach(a => {
      counts[a.answer??'0']++;
    });

    await this.updateRoom({
      roomId,
      status: 'show_answer'
    });

    return { success: true, answers };
  }

  /**
   * Player submits an answer for the current question in the room.
   * Many checks are done to ensure the validity of the answer submission
   *  
   * @param roomId 
   * @param playerName 
   * @param answer 
   * @param questionIndex 
   * @returns 
   */
  async submitAnswer(roomId: string, playerName: string, answer: string, questionIndex: number): Promise<{ success: boolean; message?: string }> {
    const room : Room | null = await this.getRoom(roomId);
    if (!room) {
      return { success: false, message: 'Room not found' };
    }
    const player = room.players.find(p => p.username === playerName);
    if (!player) {
      return { success: false, message: 'Player not found in room' };
    }
    if(room.status !== 'question_send') {
      return { success: false, message: 'You can\'t submit an answer at this time' };
    }
    if(room.currentQuestionIndex !== questionIndex) {
      return { success: false, message: 'Invalid question index' };
    }
    player.answers[questionIndex] = answer;
    await this.updateRoom(room);
    return { success: true };
  }
}
