import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideRouter(routes), 
    provideClientHydration(withEventReplay()),
    provideFirebaseApp(() => initializeApp({
      apiKey: "AIzaSyAfzwN5NsCVB5eAn77d4TRc38cdg-ZcSws",
      authDomain: "omegaservices-6fe4d.firebaseapp.com",
      projectId: "omegaservices-6fe4d",
      storageBucket: "omegaservices-6fe4d.firebasestorage.app",
      messagingSenderId: "438525374195",
      appId: "1:438525374195:web:a17c809f9f3bc9d19ed186",
      measurementId: "G-CJPF2DEFJQ"
  })),
    provideFirestore(() => getFirestore()),
  ]
};
