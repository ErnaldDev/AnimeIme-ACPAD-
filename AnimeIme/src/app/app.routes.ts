import { Routes } from '@angular/router';


export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./signup_signin/login.page').then(m => m.LoginPage),
  },
  {
    path: 'profile/:username',
    loadComponent: () => import('./profile/profile.page').then(m => m.ProfilePage)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'anime-gpt',
    loadComponent: () => import('./anime-gpt/anime-gpt.page').then(m => m.default)
  },
  {
    path: 'anime/:id',
    loadComponent: () => import('./anime-details/anime-details.page').then(m => m.AnimeDetailsPage)
  }
];
