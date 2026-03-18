import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonText,
} from '@ionic/angular/standalone';

import {
  form,
  FormField,
  minLength,
  required
} from '@angular/forms/signals';
//  import { QuizService } from 'src/app/services/quizService';
import { Quiz } from 'src/app/models/quiz';

@Component({
  selector: 'app-signal-form',
  standalone: true,
  templateUrl: './signal-form.component.html',
  styleUrls: ['./signal-form.component.scss'],
  imports: [
    CommonModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonInput,
    IonButton,
    IonText,
    FormField,
  ],
})
export class SignalFormComponent {

  defaultQuiz: Quiz = {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    questions: [
      {
        id: crypto.randomUUID(),
        text: '',
        choices: [
          { id: crypto.randomUUID(), text: '' },
          { id: crypto.randomUUID(), text: '' }
        ],
        correctChoiceId: '' // on peut initialiser avec le premier choix
      }
    ]
  };

  quizModel = signal<Quiz>({ ...this.defaultQuiz });

  quizForm = form(this.quizModel, (quiz) => {
    required(quiz.title, { message: 'Title is required' });
    minLength(quiz.questions, 1, { message: 'At least one question is required' });
  });

  constructor(/*private quizService: QuizService*/) {}

  addQuestion() {
    this.quizModel.update(quiz => ({
      ...quiz,
      questions: [
        ...quiz.questions,
        {
          id: crypto.randomUUID(),
          text: '',
          choices: [
            { id: crypto.randomUUID(), text: '' },
            { id: crypto.randomUUID(), text: '' }
          ],
          correctChoiceId: '' // optionnellement le premier choix
        }
      ]
    }));
  }

  addOption(questionIndex: number) {
    this.quizModel.update(quiz => {
      const questions = [...quiz.questions];
      const q = questions[questionIndex];
      const newChoice = { id: crypto.randomUUID(), text: '' };
      questions[questionIndex] = {
        ...q,
        choices: [...q.choices, newChoice],
        correctChoiceId: q.correctChoiceId 
      };
      return { ...quiz, questions };
    });
  }

  removeOption(questionIndex: number, choiceId: string) {
    this.quizModel.update(quiz => {
      const questions = [...quiz.questions];
      const q = questions[questionIndex];
      if (!q) return quiz;

      if (q.choices.length <= 2) return quiz; // au moins 2 options

      const newChoices = q.choices.filter(c => c.id !== choiceId);
      questions[questionIndex] = { ...q, choices: newChoices, correctChoiceId: q.correctChoiceId };
      return { ...quiz, questions };
    });
  }

onSubmit(event: Event) {
  event.preventDefault();

  const quizToSubmit: Quiz = {
    ...this.quizModel(),
    questions: this.quizModel().questions.map(q => ({
      ...q,
      correctChoiceId: q.choices[0]?.id || ''
    }))
  };

  console.log('Quiz Submitted:', quizToSubmit);
  // this.quizService.addQuiz(quizToSubmit);
}
}