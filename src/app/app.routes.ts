import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('./components/home-page/home-page.component').then(m => m.HomePageComponent),
  },
  {
    path: 'form',
    loadComponent: () =>
      import('./components/signal-form/signal-form.component').then(m => m.SignalFormComponent),
  },
  {
    path: 'game-room/:id',
    loadComponent: () =>
      import('./components/game-page/game-page.component').then(m => m.GameRoomPage),
  },
  {
    path: 'admin-game-room/:id',
    loadComponent: () =>
      import('./components/admin-game-room/admin-game-room.component').then(m => m.AdminGameRoomComponent),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login-page',
    loadComponent: () => import('./components/login-page/login-page.page').then( m => m.LoginPagePage)
  },
];