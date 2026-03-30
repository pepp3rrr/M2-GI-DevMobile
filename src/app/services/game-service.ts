import { inject, Injectable } from '@angular/core';
import { Firestore, doc, collection, setDoc, updateDoc, getDoc, getDocs, docData, collectionData } from '@angular/fire/firestore';
import { Observable, firstValueFrom, map, tap } from 'rxjs';
import { Quiz } from '../models/quiz';
import { Room } from '../models/room';
import { QuizService } from './quiz-service';
import { GameQuestion } from '../models/gameQuestion';
import { Player } from '../models/player';
import { GameResult } from '../models/gameResult';
import { writeBatch } from 'firebase/firestore';

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
    if(await getDoc(roomRef).then(snap => snap.exists())) {
      await updateDoc(roomRef, room);
    }
  }
  private async deleteRoom(roomId: string): Promise<void> {
    const batch = writeBatch(this.firestore);

    const playersColRef = collection(this.firestore, `/rooms/${roomId}/players`);
    const playersSnap = await getDocs(playersColRef);

    playersSnap.docs.forEach(playerDoc => batch.delete(playerDoc.ref));

    const roomRef = doc(this.firestore, `rooms/${roomId}`);
    batch.delete(roomRef);

    await batch.commit();

    console.log(`Room ${roomId} and all its players deleted in a batch.`);
  }
  private async getQuizWithQuestions(quizId: string): Promise<Quiz | undefined> {
    return firstValueFrom(this.quizService.getById(quizId));  
  }

  watchRoom(roomId: string): Observable<Room | null> {
    const roomRef = doc(this.firestore, 'rooms', roomId);
    return docData(roomRef) as Observable<Room | null>;
  }
  watchPlayers(roomId: string): Observable<Player[]> {
    const playersRef = collection(this.firestore, `rooms/${roomId}/players`);
    return collectionData(playersRef) as Observable<Player[]>;
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

  async nextQuestion(roomId: string) {
    const room = await this.getRoom(roomId);
    if (!room) return { success: false, message: 'Room not found' };

    const quiz = await this.getQuizWithQuestions(room.quizId);
    if (!quiz) return { success: false, message: 'Quiz not found' };

    const nextIndex = room.currentQuestionIndex + 1;
    if (nextIndex >= quiz.questions.length) return { success: false, message: 'No more questions' };

    // Reset latestAnswer for all players in the room
    const playersColRef = collection(this.firestore, `/rooms/${roomId}/players`);
    const playersSnap = await getDocs(playersColRef);

    for (const playerDoc of playersSnap.docs) {
      try {
        await updateDoc(playerDoc.ref, { latestAnswer: null });
      } catch (err) {
        console.error(`Error resetting latestAnswer for player ${playerDoc.id}:`, err);
      }
    }

    await this.updateRoom({
      roomId,
      currentQuestionIndex: nextIndex,
      status: 'question_send'
    });

    console.log(nextIndex, quiz.questions.length - 1);
    return { success: true, isLastQuestion: nextIndex === quiz.questions.length - 1 };
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
    console.log(`Fetching answers for room ${roomId}...`);
    const room = await this.getRoom(roomId);
    if (!room) {
      return { success: false, message: 'Room not found' };
    }
    console.log(`Room found: ${room.roomId}, quizId: ${room.quizId}, currentQuestionIndex: ${room.currentQuestionIndex}`);

    const quiz = await this.getQuizWithQuestions(room.quizId);
    console.log(`Quiz fetched: ${quiz ? quiz.id : 'not found'}`);
    if (!quiz) {
      return { success: false, message: 'Quiz not found' };
    }
    const currentQuestion = quiz.questions[room.currentQuestionIndex];

    console.log(`Quiz found: ${quiz.id}, title: ${quiz.title}, questions count: ${quiz.questions.length}`);

    const playersColRef = collection(this.firestore, `/rooms/${roomId}/players`);
    const playersSnap = await getDocs(playersColRef);

    // 4️⃣ Itérer sur les joueurs
    for (const playerDoc of playersSnap.docs) {
      try {
        const playerData = playerDoc.data() as Player;
        
        if (playerData.latestAnswer === currentQuestion.correctChoiceId) {
          const newScore = (playerData.score || 0) + 1;
          await updateDoc(playerDoc.ref, { score: newScore });
          console.log(`Player ${playerData.userId} answered correctly! New score: ${newScore}`);
        }
      } catch (err) {
        console.error(`Error updating score for player ${playerDoc.id}:`, err);
      }
    }

    await this.updateRoom({
      roomId,
      status: 'show_answer'
    });

    return { success: true };
  }
  async showResults(roomId: string) {
    const room = await this.getRoom(roomId);
    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    const quiz = await this.getQuizWithQuestions(room.quizId);
    if (!quiz) {
      return { success: false, message: 'Quiz not found' };
    }

    await this.updateRoom({
      roomId,
      status: 'show_score'
    });

    return { success: true };
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
  async submitAnswer(roomId: string, playerId: string, answerId: string, questionIndex: number): Promise<{ success: boolean; message?: string }> {
    const room: Room | null = await this.getRoom(roomId);
    console.log("Room ? ", room ? "yes" : "no");
    if (!room) {
      return { success: false, message: 'Room not found' };
    }
    console.log(`Good Status ? ${room.status === 'question_send' ? "yes" : "no"}, Good Index ? ${room.currentQuestionIndex === questionIndex ? "yes" : "no"}`);
    if (room.status !== 'question_send') {
      return { success: false, message: 'You can\'t submit an answer at this time' };
    }
    if (room.currentQuestionIndex !== questionIndex) {
      return { success: false, message: 'Invalid question index' };
    }

    try {
      const playerRef = doc(this.firestore, `/rooms/${roomId}/players/${playerId}`);
        await updateDoc(playerRef, {
          latestAnswer: answerId,
        });

      console.log(`Answer submitted: ${answerId} by player ${playerId} for question ${questionIndex}`);
      return { success: true };
    } catch (err) {
      console.error('Error updating player answer:', err);
      return { success: false, message: 'Failed to submit answer' };
    }
}
  async getResponseCounts(roomId: string): Promise<GameQuestion | null> {
    const room = await this.getRoom(roomId);
    if (!room) return null;
    
    const quiz = await this.getQuizWithQuestions(room.quizId);
    if (!quiz) return null;
    
    const question = quiz.questions[room.currentQuestionIndex];
    if (!question) return null;
    
    // Préparer le GameQuestion
    const gameQuestion: GameQuestion = {
      index: room.currentQuestionIndex,
      text: question.text,
      choices: question.choices.map(c => ({
        id: c.id,
        text: c.text,
        responseCount: 0
      }))
    };

    // Récupérer tous les joueurs depuis la sous-collection
    const playersColRef = collection(this.firestore, `/rooms/${roomId}/players`);
    const playersSnap = await getDocs(playersColRef);
    
    // Compter les réponses
    for (const playerDoc of playersSnap.docs) {
      const player = playerDoc.data() as { latestAnswer?: string };
      const choice = gameQuestion.choices.find(c => c.id === player.latestAnswer);
      if (choice) {
        choice.responseCount++;
      }
    }
    
    return gameQuestion;
  }
  async getGlobalScores(roomId: string) {
    const room = await this.getRoom(roomId);
    if (!room) return null;

    const globalScores : GameResult[] = [];
    
    const playersColRef = collection(this.firestore, `/rooms/${roomId}/players`);
    const playersSnap = await getDocs(playersColRef);

    for (const playerDoc of playersSnap.docs) {
      const player = playerDoc.data() as Player;
      const userSnap = await getDoc(doc(this.firestore, `users/${player.userId}`));
      const userName = userSnap.exists() ? (userSnap.data() as any).alias : 'Unknown';

      console.log(`Player ${player.userId} (${userName}) has score ${player.score}`);

      globalScores.push({
        userId: player.userId,
        userName: userName,
        score: player.score || 0
      });
    }

    return globalScores;
  }
}