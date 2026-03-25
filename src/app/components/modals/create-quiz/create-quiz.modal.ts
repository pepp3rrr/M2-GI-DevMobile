import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonList,
  ModalController
} from '@ionic/angular/standalone';

@Component({
  selector: 'create-quiz-modal',
  templateUrl: './create-quiz.modal.html',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonInput,
    IonItem,
    IonList,
    FormsModule
  ]
})
export class CreateQuizModal {

  title = '';
  questions: string[] = [];
  newQuestion = '';

  constructor(private modalCtrl: ModalController) {}

  addQuestion() {
    if (this.newQuestion.trim() !== '') {
      this.questions.push(this.newQuestion);
      this.newQuestion = '';
    }
  }

  createQuiz() {
    const quiz = {
      title: this.title,
      questions: this.questions
    };

    this.modalCtrl.dismiss(quiz);
  }

  cancel() {
    this.modalCtrl.dismiss();
  }

}