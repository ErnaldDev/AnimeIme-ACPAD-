//this is the service responsible for handling all anime-related operations and API calls
import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, doc, updateDoc, getDocs, deleteDoc, query, where, Timestamp } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError, from, BehaviorSubject, delay, retry, of } from 'rxjs';
import { Geolocation } from '@capacitor/geolocation';
import { AnimeData, JikanResponse } from '../interfaces/anime.interface';

@Injectable({
  providedIn: 'root'
})
export class AnimeService {
  //this defines the base URL for the Jikan API
  private jikanApiUrl = 'https://api.jikan.moe/v4';
  private countryCode: string | null = null;
  private countryName: string | null = null;
  private countryNameSubject = new BehaviorSubject<string>('your country');
  private readonly ITEMS_PER_PAGE = 25;

  //this initializes the AnimeService with required dependencies
  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.initializeGeolocation();
  }

  //this initializes the geolocation service and gets user's country information
  private async initializeGeolocation() {
    try {
      const permissionStatus = await Geolocation.checkPermissions();
      if (permissionStatus.location === 'prompt' || permissionStatus.location === 'prompt-with-rationale') {
        await Geolocation.requestPermissions();
      }

      const position = await Geolocation.getCurrentPosition();
      
      // Using OpenStreetMap's Nominatim service for geocoding
      const response = await this.http.get<any>(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`,
        {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'AnimeIme/1.0'
          }
        }
      ).toPromise();
      
      if (response && response.address) {
        this.countryCode = response.address.country_code?.toUpperCase();
        this.countryName = response.address.country;
        this.countryNameSubject.next(response.address.country || 'Unknown Location');
        console.log('Location detected:', response.address.country);
      } else {
        throw new Error('Could not determine location');
      }
    } catch (error) {
      console.error('Geolocation error:', error);
      // Fallback to IP-based location
      try {
        const ipResponse = await this.http.get<any>('https://ipapi.co/json/').toPromise();
        if (ipResponse && ipResponse.country_name) {
          this.countryCode = ipResponse.country_code;
          this.countryName = ipResponse.country_name;
          this.countryNameSubject.next(ipResponse.country_name);
          console.log('Location detected from IP:', ipResponse.country_name);
        } else {
          throw new Error('Could not determine location from IP');
        }
      } catch (ipError) {
        console.error('IP location error:', ipError);
        this.countryCode = null;
        this.countryName = 'Unknown Location';
        this.countryNameSubject.next('Unknown Location');
      }
    }
  }

  //this gets popular animes based on user's location
  getLocalPopularAnimes(page: number = 1, pageSize: number = 20): Observable<AnimeData[]> {
    if (!this.countryCode) {
      console.log('No country code available, falling back to global top anime');
      return this.getTopAnimes(page, pageSize);
    }
    
    return this.http.get<JikanResponse>(
      `${this.jikanApiUrl}/anime?order_by=popularity&sort=desc&page=${page}&limit=${pageSize}`
    ).pipe(
      map(response => this.transformAnimeData(response.data)),
      catchError(error => {
        console.error('Error fetching local popular anime:', error);
        return this.getTopAnimes(page, pageSize);
      })
    );
  }

  //this gets the top rated animes globally
  getTopAnimes(page: number = 1, pageSize: number = 20): Observable<AnimeData[]> {
    return this.http.get<JikanResponse>(`${this.jikanApiUrl}/top/anime?page=${page}&limit=${pageSize}`)
      .pipe(
        map(response => {
          if (!response?.data) return [];
          return this.transformAnimeData(response.data);
        }),
        catchError(error => {
          console.error('API Error:', error);
          return of([]);
        })
      );
  }

  //this gets currently airing animes
  getAiringAnimes(page: number = 1, pageSize: number = 20): Observable<AnimeData[]> {
    return this.http.get<JikanResponse>(`${this.jikanApiUrl}/seasons/now?page=${page}&limit=${pageSize}`)
      .pipe(
        map(response => this.transformAnimeData(response.data)),
        catchError(this.handleError)
      );
  }

  //this gets recommended animes for the user
  getRecommendedAnimes(page: number = 1, pageSize: number = 20): Observable<AnimeData[]> {
    return this.http.get<JikanResponse>(`${this.jikanApiUrl}/seasons/upcoming?page=${page}&limit=${pageSize}`)
      .pipe(
        map(response => this.transformAnimeData(response.data)),
        catchError(this.handleError)
      );
  }

  //this searches for animes based on a query string
  searchAnime(query: string): Observable<AnimeData[]> {
    return this.http.get<JikanResponse>(`${this.jikanApiUrl}/anime?q=${query}`)
      .pipe(
        map(response => {
          if (!response || !response.data) {
            return [];
          }
          return this.transformAnimeData(response.data);
        }),
        catchError(error => {
          console.error('Search API Error:', error);
          return of([]);
        })
      );
  }

  //this searches for animes by exact name
  searchAnimeByName(name: string): Observable<AnimeData[]> {
    const encodedName = encodeURIComponent(name);
    return this.http.get<JikanResponse>(`${this.jikanApiUrl}/anime?q=${encodedName}&sfw=true`)
      .pipe(
        map(response => {
          if (!response?.data) return [];
          return this.transformAnimeData(response.data);
        }),
        catchError(error => {
          console.error('Search API Error:', error);
          return of([]);
        })
      );
  }

  //this transforms the raw API data into our AnimeData format
  private transformAnimeData(data: any[]): AnimeData[] {
    if (!Array.isArray(data)) return [];
    
    return data.map(item => {
      try {
        return {
          myanimelist_id: item.mal_id?.toString() || '',
          title: item.title || '',
          episodes: item.episodes || 0,
          picture_url: item.images?.jpg?.image_url || '',
          type: item.type || '',
          score: item.score || 0,
          genres: item.genres?.map((g: any) => g.name || '').filter(Boolean) || []
        };
      } catch (e) {
        console.error('Error transforming anime data:', e);
        return null;
      }
    }).filter(Boolean) as AnimeData[];
  }

  //this handles API errors
  private handleError(error: any) {
    console.error('API Error:', error);
    return throwError(() => error);
  }

  //this adds an anime to the user's list with rating and status
  async addAnimeToUserList(anime: any, rating: number, status: string, progress: number) {
    try {
      const user = this.authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      //this formats the anime data consistently
      const animeData = {
        animeId: anime.myanimelist_id.toString(),
        title: anime.title,
        rating: rating || 0,
        addedAt: Timestamp.now(),
        status: status || 'watching',
        image: anime.picture_url,
        totalEpisodes: anime.episodes || 0,
        progress: progress || 0,
        type: anime.type || 'TV',
        synopsis: anime.synopsis || '',
        score: anime.score || 0
      };

      console.log('Adding anime to list:', animeData);

      const userAnimeListRef = collection(this.firestore, `users/${user.uid}/animeList`);
      const q = query(userAnimeListRef, where('animeId', '==', animeData.animeId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id;
        const animeRef = doc(this.firestore, `users/${user.uid}/animeList/${docId}`);
        await updateDoc(animeRef, animeData);
        console.log('Updated existing anime entry');
      } else {
        const docRef = await addDoc(userAnimeListRef, animeData);
        console.log('Added new anime entry with ID:', docRef.id);
      }

      return animeData;
    } catch (error) {
      console.error('Error adding anime to list:', error);
      throw error;
    }
  }

  //this updates the watching status of an anime
  async updateAnimeStatus(animeId: string, status: string) {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const animeRef = doc(this.firestore, `users/${user.uid}/animeList/${animeId}`);
    await updateDoc(animeRef, { status });
  }

  //this updates the watching progress of an anime
  async updateAnimeProgress(animeId: string, progress: number) {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const animeRef = doc(this.firestore, `users/${user.uid}/animeList/${animeId}`);
    await updateDoc(animeRef, { progress });
  }

  //this gets the user's anime list
  async getUserAnimeList(userId?: string) {
    const uid = userId || this.authService.getCurrentUser()?.uid;
    if (!uid) throw new Error('User not authenticated');

    const animeListRef = collection(this.firestore, `users/${uid}/animeList`);
    const snapshot = await getDocs(animeListRef);
    
    return snapshot.docs.map(doc => {
      const data = doc.data() as Record<string, any>;
      return {
        id: doc.id,
        animeId: data['animeId'] || '',
        title: data['title'] || '',
        rating: data['rating'] || 0,
        addedAt: data['addedAt'] || Timestamp.now(),
        status: data['status'] || 'watching',
        image: data['image'] || '',
        totalEpisodes: data['totalEpisodes'] || 0,
        progress: data['progress'] || 0,
        type: data['type'] || 'TV',
        synopsis: data['synopsis'] || '',
        score: data['score'] || 0
      };
    });
  }

  //this gets the user's country name
  getCountryName$(): Observable<string> {
    return this.countryNameSubject.asObservable();
  }

  //this removes an anime from the user's list
  async removeFromUserList(animeId: string) {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const animeRef = doc(this.firestore, `users/${user.uid}/animeList/${animeId}`);
    await deleteDoc(animeRef);
  }

  //this gets detailed information about a specific anime
  async getAnimeDetails(animeId: string) {
    try {
      const response = await this.http.get<any>(`${this.jikanApiUrl}/anime/${animeId}`).toPromise();
      return {
        myanimelist_id: response.data.mal_id,
        title: response.data.title,
        episodes: response.data.episodes,
        picture_url: response.data.images.jpg.large_image_url,
        type: response.data.type,
        score: response.data.score,
        synopsis: response.data.synopsis,
        status: response.data.status,
        genres: response.data.genres.map((g: any) => g.name)
      };
    } catch (error) {
      console.error('Error fetching anime details:', error);
      throw error;
    }
  }
}
