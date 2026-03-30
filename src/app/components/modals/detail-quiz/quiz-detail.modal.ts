import { Component, Input, inject, signal } from '@angular/core';
import { Quiz } from 'src/app/models/quiz';
import { ModalController } from '@ionic/angular/standalone';
import { QuizService } from 'src/app/services/quiz-service';
import { Question } from 'src/app/models/question';
import { addIcons } from 'ionicons';
import {
  createOutline,
  documentTextOutline,
  trashOutline,
  closeOutline,
  addOutline,
  addCircleOutline,
  checkmarkCircle,
  readerOutline
} from 'ionicons/icons';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonRadio,
  IonRadioGroup,
  IonIcon
} from "@ionic/angular/standalone";

@Component({
  selector: 'app-quiz-detail-modal',
  templateUrl: './quiz-detail.modal.html',
  standalone: true,
  styleUrls: ['quiz-detail.modal.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonInput,
    IonItem,
    IonList,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonRadio,
    IonRadioGroup,
    IonIcon
  ]
})
export class QuizDetailModal {

  @Input() quiz!: Quiz;

  private modalCtrl = inject(ModalController);
  private quizService = inject(QuizService);

  isEditing = signal(false);
  editableQuiz = signal<Quiz | null>(null);
  constructor() {
    addIcons({
      createOutline,
      documentTextOutline,
      trashOutline,
      closeOutline,
      addOutline,
      addCircleOutline,
      checkmarkCircle,
      readerOutline
    });
  }
  ngOnInit() {
    // clone to avoid mutating original directly
    this.editableQuiz.set(structuredClone(this.quiz));
  }

    enableEdit() {
    this.isEditing.set(true);
  }

  cancelEdit() {
    // reset changes
    this.editableQuiz.set(structuredClone(this.quiz));
    this.isEditing.set(false);
  }

  setTitle(value: string) {
    this.editableQuiz.update(q => q ? { ...q, title: value } : q);
  }

  setDescription(value: string) {
    this.editableQuiz.update(q => q ? { ...q, description: value } : q);
  }

  setQuestionText(questionId: string, value: string) {
    this.editableQuiz.update(q => {
      if (!q) return q;
      return {
        ...q,
        questions: q.questions.map(question =>
          question.id === questionId
            ? { ...question, text: value }
            : question
        )
      };
    });
  }

  setChoiceText(questionId: string, choiceId: string, value: string) {
    this.editableQuiz.update(q => {
      if (!q) return q;
      return {
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
      };
    });
  }

  setCorrectChoice(questionId: string, choiceId: string) {
    this.editableQuiz.update(q => {
      if (!q) return q;
      return {
        ...q,
        questions: q.questions.map(question =>
          question.id === questionId
            ? { ...question, correctChoiceId: choiceId }
            : question
        )
      };
    });
  }

  addQuestion() {
    this.editableQuiz.update(q => {
      if (!q) return q;

      return {
        ...q,
        questions: [
          ...q.questions,
          {
            id: crypto.randomUUID(),
            text: '',
            choices: [
              { id: crypto.randomUUID(), text: '' },
              { id: crypto.randomUUID(), text: '' }
            ],
            correctChoiceId: ''
          }
        ]
      };
    });
  }

  removeQuestion(questionId: string) {
    this.editableQuiz.update(q => {
      if (!q) return q;

      return {
        ...q,
        questions: q.questions.filter(q => q.id !== questionId)
      };
    });
  }

  addChoice(questionId: string) {
    this.editableQuiz.update(q => {
      if (!q) return q;

      return {
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
      };
    });
  }

  removeChoice(questionId: string, choiceId: string) {
    this.editableQuiz.update(q => {
      if (!q) return q;

      return {
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
      };
    });
  }

  isQuestionValid(question: Question): boolean {
    if (!question.text?.trim()) return false;

    if (!question.choices || question.choices.length < 2) return false;

    const hasEmptyChoice = question.choices.some(c => !c.text?.trim());
    if (hasEmptyChoice) return false;

    if (!question.correctChoiceId) return false;

    return true;
  }


  isQuizValid(): boolean {
    const quiz = this.editableQuiz();
    if (!quiz) return false;

    if (!quiz.title?.trim()) return false;

    if (!quiz.questions.length) return false;

    return quiz.questions.every((q: Question) =>
      this.isQuestionValid(q)
    );
  }

  async save() {
    const quiz = this.editableQuiz();

    if (!quiz || !this.isQuizValid()) return;

    await this.quizService.saveQuiz(quiz);

    this.isEditing.set(false);
    this.modalCtrl.dismiss();
  }

  close() {
    this.modalCtrl.dismiss();
  }

  onAddChoice(questionId: string) {
    this.addChoice(questionId);
  }
}