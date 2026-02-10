//imports for Angular core functionality and common modules
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AnimeService } from '../services/animeime.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

//imports for Ionic icons
import { addIcons } from 'ionicons';
import { 
  logOutOutline, 
  personCircleOutline, 
  closeCircle, 
  searchOutline, 
  filmOutline, 
  chevronForwardOutline, 
  star 
} from 'ionicons/icons';

//imports for Ionic UI components
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonContent,
  IonList,
  IonItem,
  IonThumbnail,
  IonLabel,
  IonSpinner,
  IonText,
  IonModal,
  IonRange,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonNote,
  IonAvatar,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular/standalone';
import { User } from '@angular/fire/auth';

//defines the structure for Anime objects
interface Anime {
  myanimelist_id: string;
  title: string;
  episodes: number;
  picture_url: string;
  type: string;
  score?: number;
}

//main component decorator with metadata
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonContent,
    IonList,
    IonItem,
    IonThumbnail,
    IonLabel,
    IonSpinner,
    IonText,
    IonModal,
    IonRange,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonNote,
    IonAvatar,
    IonSegment,
    IonSegmentButton,
  ],
})

//main HomePage class implementation
export class HomePage implements OnInit {
  //component state properties
  selectedTab = 'top';
  animes: Anime[] = [];
  isLoading = false;
  error: string | null = null;
  isRatingModalOpen = false;
  selectedAnime: any = null;
  ratingValue = 5;
  searchResults: any[] = [];
  searchQuery: string = '';
  isAuthenticated = false;
  userCountry: string = 'your country';
  selectedStatus: string = 'watching';
  progressValue: number = 0;
  currentTab: string = 'TOP ANIME';
  countryName: string = 'your country';
  isSearching: boolean = false;
  searchType: 'users' | 'anime' = 'users';
  animeResults: any[] = [];
  currentPage: number = 1;
  pageSize: number = 20; // Number of animes per load
  hasMoreAnime: boolean = true;
  isLoadingMore: boolean = false;

  //initializes the HomePage component with required services
  constructor(
    private animeService: AnimeService,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    //registers icons for use in the component
    addIcons({
      'log-out-outline': logOutOutline,
      'person-circle-outline': personCircleOutline,
      'close-circle': closeCircle,
      'search-outline': searchOutline,
      'film-outline': filmOutline,
      'chevron-forward-outline': chevronForwardOutline,
      'star': star
    });

    //subscribes to user authentication state changes
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.isAuthenticated = !!user;
    });

    //subscribes to user country updates
    this.animeService.getCountryName$().subscribe(country => {
      this.userCountry = country;
      this.countryName = country;
    });
  }

  //lifecycle hook for component initialization
  ngOnInit() {
    this.loadAnimes();
  }

  //handles segment changes in the UI
  segmentChanged(event: any) {
    const selectedValue = event.detail.value;
    
    if (selectedValue === 'anime-gpt') {
      this.router.navigate(['/anime-gpt']);
      return;
    }

    this.selectedTab = selectedValue;
    this.currentPage = 1; // Reset to first page
    this.hasMoreAnime = true;
    this.loadAnimes(selectedValue);
  }

  //loads anime data based on selected category
  loadAnimes(type: string = 'top') {
    this.isLoading = true;
    this.error = null;
    
    switch(type) {
      case 'top':
        this.animeService.getTopAnimes(this.currentPage, this.pageSize).subscribe({
          next: (data: Anime[]) => {
            if (this.currentPage === 1) {
              this.animes = data;
            } else {
              this.animes = [...this.animes, ...data];
            }
            this.hasMoreAnime = data.length === this.pageSize;
            this.isLoading = false;
          },
          error: this.handleError.bind(this)
        });
        break;
      case 'trending':
        this.animeService.getAiringAnimes().subscribe({
          next: (data: Anime[]) => {
            this.animes = data;
            this.isLoading = false;
          },
          error: this.handleError.bind(this)
        });
        break;
      case 'local':
        this.animeService.getLocalPopularAnimes().subscribe({
          next: (data: Anime[]) => {
            this.animes = data;
            this.isLoading = false;
          },
          error: this.handleError.bind(this)
        });
        break;
      case 'new':
        this.animeService.getRecommendedAnimes().subscribe({
          next: (data: Anime[]) => {
            this.animes = data;
            this.isLoading = false;
          },
          error: this.handleError.bind(this)
        });
        break;
    }
  }

  //handles errors during anime loading
  private handleError(error: any) {
    console.error('Error loading animes:', error);
    this.error = 'Failed to load animes';
    this.isLoading = false;
  }

  addToList(anime: any) {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.selectedAnime = anime;
    this.selectedStatus = 'watching';
    this.progressValue = 0;
    this.ratingValue = 5;
    this.isRatingModalOpen = true;
  }

  cancelRating() {
    this.isRatingModalOpen = false;
    this.selectedAnime = null;
    this.ratingValue = 5;
    this.selectedStatus = 'watching';
    this.progressValue = 0;
  }

  async submitRating() {
    if (this.selectedAnime) {
      try {
        await this.animeService.addAnimeToUserList(
          this.selectedAnime, 
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
        this.selectedAnime = null;
        this.ratingValue = 5;
        this.selectedStatus = 'watching';
        this.progressValue = 0;
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

  async handleSearch(event: any) {
    try {
      const query = event.target.value?.trim();
      this.searchQuery = query;
      
      // Clear results if query is too short
      if (!query || query.length < 2) {
        this.searchResults = [];
        this.animeResults = [];
        return;
      }

      this.isSearching = true;

      // Handle Enter key press
      if (event.key === 'Enter') {
        if (this.searchType === 'users' && this.searchResults.length > 0) {
          const firstUser = this.searchResults[0];
          this.navigateToProfile(firstUser.username);
          return;
        } else if (this.searchType === 'anime' && this.animeResults.length > 0) {
          this.navigateToAnime(this.animeResults[0]);
          return;
        }
      }

      // Regular search
      if (this.searchType === 'users') {
        const users = await this.authService.searchUsers(query);
        this.searchResults = await Promise.all(
          users.map(async (user) => {
            try {
              const animeList = await this.animeService.getUserAnimeList(user.uid);
              return {
                ...user,
                animeCount: animeList.length
              };
            } catch (error) {
              return {
                ...user,
                animeCount: 0
              };
            }
          })
        );
        this.animeResults = [];
      } else {
        // Search anime
        this.animeService.searchAnimeByName(query).subscribe(
          (results) => {
            this.animeResults = results;
            this.searchResults = [];
          },
          (error) => {
            console.error('Error searching anime:', error);
            this.animeResults = [];
          }
        );
      }
    } catch (error) {
      console.error('Error in search:', error);
      this.searchResults = [];
      this.animeResults = [];
    } finally {
      this.isSearching = false;
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.animeResults = [];
  }

  async navigateToMyProfile() {
    try {
      console.log('1. My Profile button clicked');
      const currentUser = this.authService.getCurrentUser();
      console.log('2. Current user:', currentUser);

      if (currentUser) {
        const userProfile = await this.authService.getUserProfile(currentUser.uid);
        console.log('3. User profile:', userProfile);

        if (userProfile) {
          console.log('4. Attempting navigation to profile with username:', userProfile.username);
          await this.router.navigate(['/profile', userProfile.username || currentUser.uid]);
          console.log('5. Navigation completed');
        } else {
          console.error('4. User profile not found, falling back to UID');
          await this.router.navigate(['/profile', currentUser.uid]);
        }
      } else {
        console.error('2. No current user found, redirecting to login');
        this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Error in navigateToMyProfile:', error);
    }
  }

  navigateToProfile(username: string) {
    if (!username) return;
    
    this.searchQuery = '';
    this.searchResults = [];
    this.animeResults = [];
    this.router.navigate(['/profile', username.toLowerCase()]);
  }

  async signOut() {
    try {
      await this.authService.signOutUser();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  switchTab(tab: string) {
    this.currentTab = tab;
    switch(tab) {
      case 'TOP ANIME':
        this.loadAnimes('top');
        break;
      case 'TRENDING':
        this.loadAnimes('trending');
        break;
      case 'POPULAR IN IRELAND':
        this.loadAnimes('local');
        break;
      case 'NEW/UPCOMING':
        this.loadAnimes('new');
        break;
      case 'ANIMEGPT':
        this.navigateToGPT();
        break;
    }
  }

  navigateToGPT() {
    this.router.navigate(['/anime-gpt']);
  }

  navigateToAnime(anime: any) {
    if (anime?.myanimelist_id) {
      this.clearSearch();
      this.router.navigate(['/anime', anime.myanimelist_id]);
    }
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.isSearching = true;
      this.animeService.searchAnimeByName(this.searchQuery).subscribe({
        next: (results) => {
          this.searchResults = results.slice(0, 5); // Limit to 5 results
          this.isSearching = false;
        },
        error: (error) => {
          console.error('Search error:', error);
          this.isSearching = false;
          this.searchResults = [];
        }
      });
    } else {
      this.searchResults = [];
    }
  }

  selectSuggestion(suggestion: any) {
    this.searchQuery = suggestion.title; // Set the search query to the selected suggestion
    this.searchResults = []; // Clear suggestions
    // Optionally, trigger a search or navigate to the selected anime
  }

  async loadMore() {
    if (this.isLoadingMore || !this.hasMoreAnime) return;
    
    this.isLoadingMore = true;
    this.currentPage++;
    await this.loadAnimes(this.selectedTab);
    this.isLoadingMore = false;
  }
}
