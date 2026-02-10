//this handles the AI-powered anime recommendation functionality
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import { AnimeService } from '../services/animeime.service';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { AnimeData } from '../interfaces/anime.interface';
import {
  IonicModule,
  ToastController,
  ModalController
} from '@ionic/angular';

//this defines the structure for anime recommendations
interface AnimeRecommendation {
  title: string;
  imageUrl: string;
  genres: string[];
  description: string;
  score: number;
  type: string;
  episodes: number;
}

//this configures the AnimeGPT component
@Component({
  selector: 'app-anime-gpt',
  templateUrl: './anime-gpt.page.html',
  styleUrls: ['./anime-gpt.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule
  ]
})
export class AnimeGPTPage {
  //this initializes the component's state variables
  searchQuery: string = '';
  recommendations: AnimeRecommendation[] = [];
  isLoading: boolean = false;
  isRatingModalOpen: boolean = false;
  selectedAnime: any = null;
  ratingValue: number = 5;
  selectedStatus: string = 'watching';
  progressValue: number = 0;

  //this injects the required services
  constructor(
    private animeService: AnimeService,
    private router: Router,
    private toastController: ToastController,
    private authService: AuthService,
    private userService: UserService,
    private modalController: ModalController
  ) {
    addIcons({ 'arrow-back-outline': arrowBackOutline });
  }

  //this handles navigation back to home
  goBack() {
    this.router.navigate(['/home']);
  }

  //this fetches anime recommendations based on search query
  async getRecommendations() {
    if (!this.searchQuery.trim()) return;
    this.isLoading = true;
    
    try {
      //this gets the searched anime to find its genres
      this.animeService.searchAnimeByName(this.searchQuery).subscribe(searchResults => {
        if (searchResults.length > 0) {
          const searchedAnime = searchResults[0];
          
          //this gets recommendations based on genres
          this.animeService.getTopAnimes().subscribe(allAnime => {
            let recommendations = allAnime.filter(anime => 
              anime.myanimelist_id !== searchedAnime.myanimelist_id &&
              anime.score >= 7 &&
              anime.genres.some(genre => searchedAnime.genres.includes(genre))
            );

            recommendations = this.shuffleArray(recommendations);

            //this formats the recommendations for display
            this.recommendations = recommendations.slice(0, 20).map((anime: AnimeData) => ({
              title: anime.title,
              imageUrl: anime.picture_url || anime.image_url || anime.images?.jpg?.image_url || '',
              genres: anime.genres,
              description: `${anime.type} • ${anime.episodes} episodes`,
              score: anime.score,
              type: anime.type,
              episodes: anime.episodes
            }));
          });
        }
        this.isLoading = false;
      });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      this.isLoading = false;
    }
  }

  //this randomizes the array of recommendations
  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  //this handles adding an anime to user's list
  async addToList(anime: AnimeRecommendation) {
    if (!this.authService.isAuthenticated()) {
      const toast = await this.toastController.create({
        message: 'Please sign in to add anime to your list',
        duration: 2000,
        position: 'bottom',
        color: 'warning'
      });
      await toast.present();
      return;
    }

    this.selectedAnime = anime;
    this.selectedStatus = 'watching';
    this.progressValue = 0;
    this.ratingValue = 5;
    this.isRatingModalOpen = true;
  }

  //this resets the rating modal state
  cancelRating() {
    this.isRatingModalOpen = false;
    this.selectedAnime = null;
    this.ratingValue = 5;
    this.selectedStatus = 'watching';
    this.progressValue = 0;
  }

  //this processes the rating submission
  async submitRating() {
    if (this.selectedAnime) {
      try {
        await this.userService.addAnimeToList({
          ...this.selectedAnime,
          rating: this.ratingValue,
          status: this.selectedStatus,
          progress: this.progressValue
        });
        
        const toast = await this.toastController.create({
          message: 'Added to your list!',
          duration: 2000,
          position: 'bottom',
          color: 'success'
        });
        await toast.present();
        
        this.isRatingModalOpen = false;
        this.selectedAnime = null;
        this.ratingValue = 5;
        this.selectedStatus = 'watching';
        this.progressValue = 0;
      } catch (error: any) {
        console.error('Error adding to list:', error);
        const toast = await this.toastController.create({
          message: `Failed to add to list: ${error.message || 'Unknown error'}`,
          duration: 2000,
          position: 'bottom',
          color: 'danger'
        });
        await toast.present();
      }
    }
  }

  //this navigates to the anime details page
  navigateToAnime(anime: AnimeRecommendation) {
    this.animeService.searchAnimeByName(anime.title).subscribe(results => {
      if (results && results.length > 0) {
        const animeId = results[0].myanimelist_id;
        this.router.navigate(['/anime', animeId]);
      }
    });
  }
}

export default AnimeGPTPage;