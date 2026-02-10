//this handles the anime details page functionality and display
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnimeService } from '../services/animeime.service';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { starOutline } from 'ionicons/icons';

@Component({
  selector: 'app-anime-details',
  templateUrl: './anime-details.page.html',
  styleUrls: ['./anime-details.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, FormsModule]
})
export class AnimeDetailsPage implements OnInit {
  //this initializes the component's state variables
  anime: any = null;
  isLoading = true;
  isRatingModalOpen = false;
  ratingValue = 5;
  selectedStatus = 'watching';
  progressValue = 0;

  //this injects the required services for the component
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private animeService: AnimeService,
    private authService: AuthService,
    private toastController: ToastController
  ) {
    addIcons({ 'star-outline': starOutline });
  }

  //this fetches the anime details when the page loads
  async ngOnInit() {
    const animeId = this.route.snapshot.paramMap.get('id');
    if (animeId) {
      try {
        this.anime = await this.animeService.getAnimeDetails(animeId);
      } catch (error) {
        console.error('Error loading anime details:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }

  //this handles the add to list button click
  async addToList() {
    if (!this.authService.isAuthenticated()) {
      const toast = await this.toastController.create({
        message: 'Please log in to add anime to your list',
        duration: 2000,
        position: 'bottom',
        color: 'warning'
      });
      toast.present();
      this.router.navigate(['/login']);
      return;
    }
    this.isRatingModalOpen = true;
  }

  //this resets the rating modal state
  cancelRating() {
    this.isRatingModalOpen = false;
    this.ratingValue = 5;
    this.selectedStatus = 'watching';
    this.progressValue = 0;
  }

  //this processes the rating submission and updates the user's list
  async submitRating() {
    if (this.anime) {
      try {
        await this.animeService.addAnimeToUserList(
          this.anime,
          this.ratingValue,
          this.selectedStatus,
          this.progressValue
        );
        
        const toast = await this.toastController.create({
          message: 'Anime added to your list!',
          duration: 2000,
          position: 'bottom',
          color: 'success'
        });
        toast.present();
        
        this.isRatingModalOpen = false;
        this.ratingValue = 5;
        this.selectedStatus = 'watching';
        this.progressValue = 0;

        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          const userProfile = await this.authService.getUserProfile(currentUser.uid);
          if (userProfile?.username) {
            this.router.navigate(['/profile', userProfile.username]);
          }
        }
      } catch (error) {
        console.error('Error adding anime:', error);
        const toast = await this.toastController.create({
          message: 'Error adding anime to list',
          duration: 2000,
          position: 'bottom',
          color: 'danger'
        });
        toast.present();
      }
    }
  }
} 