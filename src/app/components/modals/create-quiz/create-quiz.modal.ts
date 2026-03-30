import { Component, inject, signal } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonList, IonRadio, IonRadioGroup, IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardContent, ModalController, IonIcon } from '@ionic/angular/standalone';

import { Quiz } from 'src/app/models/quiz';
import { Question } from 'src/app/models/question';
import { addIcons } from 'ionicons';
import {
  addOutline,
  addCircleOutline,
  trashOutline,
  closeOutline,
  helpCircleOutline,
  ellipseOutline,
  documentTextOutline,
  createOutline
} from 'ionicons/icons';

@Component({
  selector: 'create-quiz-modal',
  standalone: true,
  templateUrl: './create-quiz.modal.html',
  styleUrls: ['./create-quiz.modal.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonInput,
    IonItem,
    IonList,
    IonRadio,
    IonRadioGroup,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon
]
})
export class CreateQuizModal {

  private modalCtrl = inject(ModalController);
  constructor() {
    addIcons({
      addOutline,
      addCircleOutline,
      trashOutline,
      closeOutline,
      helpCircleOutline,
      ellipseOutline,
      documentTextOutline,
      createOutline
    });
  }
  quiz = signal<Quiz>({
    id: crypto.randomUUID(),
    title: '',
    description: '',
    questions: []
  });


  addQuestion() {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      text: '',
      choices: [
        { id: crypto.randomUUID(), text: '' },
        { id: crypto.randomUUID(), text: '' }
      ],
      correctChoiceId: ''
    };

    this.quiz.update(q => ({
      ...q,
      questions: [...q.questions, newQuestion]
    }));
  }

  removeQuestion(questionId: string) {
    this.quiz.update(q => ({
      ...q,
      questions: q.questions.filter(q => q.id !== questionId)
    }));
  }

  addChoice(questionId: string) {
    this.quiz.update(q => ({
      ...q,
      questions: q.questions.map(question =>
        question.id === questionId
          ? {
              ...question,
              choices: [
                ...question.choices,
                { id: crypto.randomUUID(), text: '' }
              ]
            }
          : question
      )
    }));
  }

  removeChoice(questionId: string, choiceId: string) {
    this.quiz.update(q => ({
      ...q,
      questions: q.questions.map(question => {
        if (question.id !== questionId) return question;

        const updatedChoices = question.choices.filter(c => c.id !== choiceId);

        return {
          ...question,
          choices: updatedChoices,
          correctChoiceId:
            question.correctChoiceId === choiceId
              ? updatedChoices[0]?.id ?? ''
              : question.correctChoiceId
        };
      })
    }));
  }

  setTitle(value: string) {
    this.quiz.update(q => ({ ...q, title: value }));
  }

  setDescription(value: string) {
    this.quiz.update(q => ({ ...q, description: value }));
  }

  setQuestionText(questionId: string, value: string) {
    this.quiz.update(q => ({
      ...q,
      questions: q.questions.map(question =>
        question.id === questionId
          ? { ...question, text: value }
          : question
      )
    }));
  }

  setChoiceText(questionId: string, choiceId: string, value: string) {
    this.quiz.update(q => ({
      ...q,
      questions: q.questions.map(question =>
        question.id === questionId
          ? {
              ...question,
              choices: question.choices.map(choice =>
                choice.id === choiceId
                  ? { ...choice, text: value }
                  : choice
              )
            }
          : question
      )
    }));
  }

  setCorrectChoice(questionId: string, choiceId: string) {
    this.quiz.update(q => ({
      ...q,
      questions: q.questions.map(question =>
        question.id === questionId
          ? { ...question, correctChoiceId: choiceId }
          : question
      )
    }));
  }

  createQuiz() {
    const quiz = this.quiz();

    if (!this.isQuizValid()) return;

    this.modalCtrl.dismiss(quiz);
  }

  cancel() {
    this.modalCtrl.dismiss();
  }

  isQuestionValid(question: Question): boolean {
    if (!question.text.trim()) return false;
    if (question.choices.length < 2) return false;
    if (!question.correctChoiceId) return false;

    return question.choices.every(c => c.text.trim() !== '');
  } 

  isQuizValid(): boolean {
    const quiz = this.quiz();

    if (!quiz.title.trim()) return false;
    if (quiz.questions.length === 0) return false;

    return quiz.questions.every(q => this.isQuestionValid(q));
  }
}