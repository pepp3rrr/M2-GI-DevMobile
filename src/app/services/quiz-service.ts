import { inject, Injectable } from '@angular/core';
import { from, Observable, of, switchMap, tap } from 'rxjs';
import { Quiz } from '../models/quiz';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  setDoc
} from '@angular/fire/firestore';

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

    return collectionData(quizzesCollection, { idField: 'id' }).pipe(
      switchMap(async (quizzes: any[]) => {

        const result = await Promise.all(
          quizzes.map(async quiz => {
            const questions = await this.loadQuestions(quiz.questions);       
            return {
              ...quiz,
              questions
            };
          })
        );

        return result;
      })
    );
}

  getById(quizId: string): Observable<Quiz | undefined> {
    const quizRef = doc(this.firestore, `quizzes/${quizId}`);

    return docData(quizRef, { idField: 'id' }).pipe(
      switchMap(async (quiz: any) => {
        if (!quiz) return undefined;

        const questions = await this.loadQuestions(quiz.questions);
        return {
          ...quiz,
          questions
        };
      })
    );
  }
  
  async loadQuestions(questionRefs: any[]) {
    const questions = await Promise.all(
      questionRefs.map(ref => getDoc(ref))
    );

    return questions.map(q => q.data());
  }
  
  async addQuiz(quiz: Quiz): Promise<string> {
    const quizzesCollection = collection(this.firestore, 'quizzes');
    const questionsCollection = collection(this.firestore, 'questions');

    // 1. Create all questions first
    const questionRefs = await Promise.all(
      quiz.questions.map(q =>
        addDoc(questionsCollection, {
          text: q.text,
          choices: q.choices,
          correctChoiceId: q.correctChoiceId
        })
      )
    );
    // 2. Create quiz with references
    const quizDoc = await addDoc(quizzesCollection, {
      title: quiz.title,
      description: quiz.description,
      questions: questionRefs
    });
    
    return quizDoc.id;
  }

  deleteQuiz(quizId: string): Promise<void> {
    const quizRef = doc(this.firestore, `quizzes/${quizId}`);
    return deleteDoc(quizRef);
  }

  updateQuiz(updatedQuiz: Quiz): Observable<Quiz> {
    const quizRef = doc(this.firestore, 'quizzes', updatedQuiz.id);

    const questionRefs = updatedQuiz.questions.map(q =>
      doc(this.firestore, 'questions', q.id)
    );

    return from(
      updateDoc(quizRef, {
        title: updatedQuiz.title,
        description: updatedQuiz.description,
        questions: questionRefs
      }).then(() => updatedQuiz)
    );
  }

  async saveQuiz(quiz: Quiz): Promise<void> {
    const quizRef = doc(this.firestore, 'quizzes', quiz.id);
    const questionsCollection = collection(this.firestore, 'questions');

    // 1. Save all questions (set = create/update)
    const questionRefs = await Promise.all(
      quiz.questions.map(async (q) => {
        const questionRef = doc(questionsCollection, q.id);

        await setDoc(questionRef, {
          text: q.text,
          choices: q.choices,
          correctChoiceId: q.correctChoiceId
        });

        return questionRef;
      })
    );

    // 2. Save quiz (set = create/update)
    await setDoc(quizRef, {
      title: quiz.title,
      description: quiz.description,
      questions: questionRefs
    });
  }
}