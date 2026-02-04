import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Quiz } from '../models/quiz';
import { collectionData, docData, Firestore } from '@angular/fire/firestore';
import { collection, deleteDoc, doc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class QuizService {

  private firestore: Firestore = inject(Firestore);

  private quizzes: Quiz[] = [
    {
      id: '000',
      title: 'Quiz 0',
      questions: [],
      description: '1st quiz, with id 000'
    }
  ];

  getAll(): Observable<Quiz[]> {
    const quizzesCollection = collection(this.firestore, 'quizzes');
    return collectionData(quizzesCollection, { idField: 'id' }) as Observable<Quiz[]>;
  }

  get(quizId: string): Observable<Quiz | undefined> {
    const quizRef = doc(this.firestore, `quizzes/${quizId}`);
    return docData(quizRef, { idField: 'id' }) as Observable<Quiz | undefined>;
  }

  addQuiz(quiz: Quiz): Observable<Quiz> { // TODO: connect to Firestore
    this.quizzes = [...this.quizzes, quiz];
    return of(quiz);
  }

  deleteQuiz(quizId: string): Observable<void> { // TODO: connect to Firestore
    //const quizRef = doc(this.firestore, `quizzes/${quizId}`);
    //deleteDoc(quizRef);
    //return of(void 0);
    this.quizzes = this.quizzes.filter(q => q.id !== quizId);
    return of(void 0);
  }

  updateQuiz(updatedQuiz: Quiz): Observable<Quiz> { // TODO: connect to Firestore
    this.quizzes = this.quizzes.map(q =>
      q.id === updatedQuiz.id ? updatedQuiz : q
    );
    return of(updatedQuiz);
  }
}