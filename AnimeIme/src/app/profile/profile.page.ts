//imports for Angular core functionality and modules
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AnimeService } from '../services/animeime.service';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AnimeListItem } from '../interfaces/anime.interface';

//imports for Ionic icons
import { addIcons } from 'ionicons';
import { trashOutline, caretUpOutline, caretDownOutline, swapVerticalOutline } from 'ionicons/icons';

//main component decorator with metadata
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})

//main ProfilePage class implementation
export class ProfilePage implements OnInit {
  //component state properties
  userProfile: any = null;
  animeList: AnimeListItem[] = [];
  isLoading = true;
  isOwnProfile = false;
  statusFilter: string = 'all';
  filteredAnimeList: any[] = [];
  sortDirection: 'asc' | 'desc' | null = null;

  //initializes the ProfilePage component with required services
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private animeService: AnimeService,
    private toastController: ToastController
  ) {
    //registers icons for use in the component
    addIcons({ 
      'trash-outline': trashOutline,
      'caret-up': caretUpOutline,
      'caret-down': caretDownOutline,
      'swap-vertical': swapVerticalOutline
    });
  }

  //lifecycle hook for component initialization
  async ngOnInit() {
    try {
      const username = this.route.snapshot.paramMap.get('username');
      if (!username) return;

      //loads user profile and anime list
      const users = await this.authService.searchUsers(username);
      const userProfile = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      
      if (userProfile) {
        this.userProfile = userProfile;
        
        //checks if viewing own profile
        const currentUser = this.authService.getCurrentUser();
        this.isOwnProfile = currentUser?.uid === userProfile.uid;

        //loads user's anime list
        this.animeList = await this.animeService.getUserAnimeList(userProfile.uid);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      this.isLoading = false;
    }
    this.filterAnimeList();
  }

  //handles anime removal from user's list
  async removeAnime(animeId: string | undefined) {
    if (!animeId) return;
    
    try {
      await this.animeService.removeFromUserList(animeId);
      this.animeList = this.animeList.filter(anime => anime.id !== animeId);
      
      //shows success message
      const toast = await this.toastController.create({
        message: 'Anime removed from list',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      toast.present();
    } catch (error) {
      //shows error message
      console.error('Error removing anime:', error);
      const toast = await this.toastController.create({
        message: 'Error removing anime',
        duration: 2000,
        position: 'bottom',
        color: 'danger'
      });
      toast.present();
    }
  }

  //filters anime list based on status
  filterAnimeList() {
    if (this.statusFilter === 'all') {
      this.filteredAnimeList = this.animeList;
    } else {
      this.filteredAnimeList = this.animeList.filter(anime => 
        anime.status.toLowerCase() === this.statusFilter
      );
    }
  }

  //gets count of completed anime
  getCompletedCount(): number {
    return this.animeList.filter(anime => 
      anime.status.toLowerCase() === 'completed'
    ).length;
  }

  //gets count of currently watching anime
  getWatchingCount(): number {
    return this.animeList.filter(anime => 
      anime.status.toLowerCase() === 'watching'
    ).length;
  }

  //calculates average rating of all anime
  getAverageRating(): number {
    if (this.animeList.length === 0) return 0;
    const total = this.animeList.reduce((sum, anime) => sum + anime.rating, 0);
    return total / this.animeList.length;
  }

  //handles sorting of anime list by rating
  sortByRating() {
    if (!this.sortDirection || this.sortDirection === 'desc') {
      //sort high to low
      this.animeList.sort((a, b) => b.rating - a.rating);
      this.sortDirection = 'asc';
    } else {
      //sort low to high
      this.animeList.sort((a, b) => a.rating - b.rating);
      this.sortDirection = 'desc';
    }
  }
} 