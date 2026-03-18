import { Component, Input, OnInit } from '@angular/core';
import { Quiz } from 'src/app/models/quiz';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, ModalController, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonIcon } from "@ionic/angular/standalone";

@Component({
  selector: 'app-quiz-detail-modal',
  templateUrl: './quiz-detail.modal.html',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonIcon
  ],
  styleUrls: ['quiz-detail.modal.scss']
})

export class QuizDetailModal implements OnInit {
  @Input() quiz!: Quiz;

  questions: any[] = [];

  constructor(
    private modalCtrl: ModalController,
  ) {}

  ngOnInit() {
    this.questions = this.quiz.questions;
  }

  close() {
    this.modalCtrl.dismiss();
  }
}