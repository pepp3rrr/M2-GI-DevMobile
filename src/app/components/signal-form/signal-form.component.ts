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
  IonIcon,
  IonText,
  IonCheckbox
} from '@ionic/angular/standalone';

import {
  form,
  FormField,
  minLength,
  required,
  validate
} from '@angular/forms/signals';

@Component({
  selector: 'app-signal-form',
  standalone: true,
  templateUrl: './signal-form.component.html',
  styleUrls: ['./signal-form.component.scss'],
  imports: [
    CommonModule,
    
    // Ionic
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonText,
    IonCheckbox,
    
    // Forms signals
    FormField
  ],
})
export class SignalFormComponent {
  
  quizModel = signal/*<Quiz>*/({
    title: '',
    questions: [{
      id: crypto.randomUUID(),
      text: '1+1=2 ?', 
      options: [
        {id: crypto.randomUUID(), text: "vrais", isCorrect: true}, 
        {id: crypto.randomUUID(), text: "faux", isCorrect: false}
      ]}, 
      {
        id: crypto.randomUUID(),
        text: '11*12=122 ?',
        options: [
          {id: crypto.randomUUID(), text: "vrais", isCorrect: false}, 
          {id: crypto.randomUUID(), text: "faux", isCorrect: true}
        ]
      },
    ],
    description: ''
  });

  quizForm = form(this.quizModel, (quiz) => {
    required(quiz.title, { message: 'Title is required'})
    minLength(quiz.questions, 1, { message: 'At least one question is required'})
    /*
    validate(quiz.questions, (questions) => {
      const list = questions.value();
      for (let i = 0; i < list.length; i++) {
        const question = list[i];
        
        if (!question.text || question.text.trim().length < 1) {
          return { kind:"error" ,message: 'Each question must have a text' };
        }
        
        if (!question.options || question.options.length < 2) {
          return { kind:"error" ,message: 'Each question must have at least 2 options' };
        } 
        
        const correctAnswers = question.options.filter(o => o.isCorrect);
        if (correctAnswers.length !== 1) {
          return { kind:"error" ,message: 'Each question must have exactly one correct answer' };
        }
        
        for (const option of question.options) {
          if (!option.text || option.text.trim().length < 1) {
            return { kind:"error" ,message: 'Each option must have a text' };
          }
        }
      }
      
      return null; // tout est good
    });*/
    
  });
  
  // Ajouter les forms des questions + delete d'un question form + add questoin form
  addQuestion() {/*
    console.log('Adding question');
    console.log(this.quizModel().questions);
    this.quizModel().set
    this.quizModel().questions = [...this.quizModel().questions, {text: 'New Question'}];
    console.log(this.quizModel().questions);
    */
    this.quizModel.update(quiz => ({
      ...quiz,
      questions: [
        ...quiz.questions,
        { 
          id: crypto.randomUUID(),
          text: 'New Question',  
          options: [
            {id: crypto.randomUUID(), text: "Option 1", isCorrect: false}, 
            {id: crypto.randomUUID(), text: "Option 2", isCorrect: false}
          ]
        }
      ]
    }));
  }
  
  constructor() { }
  
  onSubmit(event: Event) {
    console.log('Submitting quiz form');
    event.preventDefault();
    
    const quizResult = this.quizModel()
    console.log('Quiz Submitted:', quizResult);
  }
  /*
  removeOptionOf(optionId: string, questionId: string) {
  console.log('Removing option' + optionId + 'from question' + questionId);
  this.quizModel.update(quiz => ({
  ...quiz,
  questions: quiz.questions.map(question => {
  console.log(question.id, questionId, question.id === questionId);
  if (question.id === questionId) {
  return {
  ...question,
  options: question.options.filter(option => option.id !== optionId)
  };
  }
  return question;
  })
  }));
  }
  addOptionTo(questionId: string) {
  console.log('Adding option to question', questionId);
  this.quizModel.update(quiz => ({
  ...quiz,
  questions: quiz.questions.map(question => {
  if (question.id === questionId) {
  return {
  ...question,
  options: [
  ...question.options,
  { id: crypto.randomUUID(), text: 'New Option', isCorrect: false }
  ]
  };
  }
  return question;
  })
  }));
  }
  */  
}
