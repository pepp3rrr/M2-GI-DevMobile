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

      return questions.map(q => ({
        id: q.id,
        ...(q.data() as any)
      }));
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

  async deleteQuiz(quizId: string): Promise<void> {
    const quizRef = doc(this.firestore, `quizzes/${quizId}`);

    // 1. Get quiz data
    const quizSnap = await getDoc(quizRef);

    if (!quizSnap.exists()) {
      console.warn('Quiz not found');
      return;
    }

    const quizData = quizSnap.data();

    // 2. Extract question refs
    const questionRefs = quizData['questions'] || [];

    // 3. Delete all questions
    await Promise.all(
      questionRefs.map((ref: any) => deleteDoc(ref))
    );

    // 4. Delete quiz
    await deleteDoc(quizRef);
  }

    async saveQuiz(quiz: Quiz): Promise<void> {
      const quizRef = doc(this.firestore, 'quizzes', quiz.id);

      const questionsCollection = collection(this.firestore, 'questions');

      const questionRefs = await Promise.all(
        quiz.questions.map(async (q, index) => {
          const questionRef = doc(questionsCollection, q.id);

          await setDoc(questionRef, {
            text: q.text,
            choices: q.choices,
            correctChoiceId: q.correctChoiceId
          });

          return questionRef;
        })
      );

      await setDoc(quizRef, {
        title: quiz.title,
        description: quiz.description,
        questions: questionRefs
      });
    }
  }