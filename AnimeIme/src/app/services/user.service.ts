//this is the service responsible for managing user-specific anime list operations
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Firestore, doc, setDoc, collection } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  //this initializes the UserService with required dependencies
  constructor(
    private authService: AuthService,
    private firestore: Firestore
  ) {}

  //this is the method that adds an anime to the user's list with proper data formatting
  async addAnimeToList(anime: any): Promise<void> {
    try {
      //this checks if the user is authenticated
      const user = this.authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');
      
      //this creates a unique document ID using the anime title
      const safeTitle = anime.title.replace(/[/\\?%*:|"<>]/g, '-');
      const userAnimeListRef = doc(this.firestore, 'users', user.uid, 'animeList', safeTitle);
      
      //this formats the anime data for storage
      const animeData = {
        title: anime.title,
        image: anime.imageUrl || anime.picture_url || anime.image_url || anime.images?.jpg?.image_url,
        type: anime.type,
        episodes: anime.episodes,
        genres: anime.genres || [],
        score: anime.score || 0,
        status: anime.status || 'Plan to Watch',
        progress: anime.progress || 0,
        rating: anime.rating || 0,
        userId: user.uid,
        dateAdded: new Date().toISOString()
      };

      //this logs the data being saved for debugging purposes
      console.log('Saving anime data:', animeData);
      
      //this saves the anime data to Firestore
      await setDoc(userAnimeListRef, animeData, { merge: true });
      
    } catch (error: any) {
      console.error('Error in addAnimeToList:', error);
      throw error;
    }
  }
} 