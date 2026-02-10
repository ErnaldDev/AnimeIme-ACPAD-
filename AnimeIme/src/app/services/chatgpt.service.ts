//this is the service responsible for providing anime recommendations using anime data
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AnimeService } from './animeime.service';
import { AnimeData } from '../interfaces/anime.interface';

@Injectable({
  providedIn: 'root'
})
export class ChatGPTService {
  //this initializes the ChatGPTService with required dependencies
  constructor(private animeService: AnimeService) {}

  //this is a helper method to shuffle array elements randomly
  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  //this gets anime recommendations based on a query string
  getAnimeRecommendations(query: string): Observable<any> {
    if (!query.trim()) {
      return of({
        choices: [{
          message: {
            content: 'Please enter an anime title to get recommendations.'
          }
        }]
      });
    }

    //this searches for anime and gets recommendations
    return this.animeService.searchAnimeByName(query).pipe(
      switchMap(searchResults => {
        if (!searchResults.length) {
          return of({
            choices: [{
              message: {
                content: `No anime found matching "${query}". Please try another title.`
              }
            }]
          });
        }

        const searchedAnime = searchResults[0];

        //this gets top animes and filters for recommendations
        return this.animeService.getTopAnimes().pipe(
          map(allAnime => {
            let recommendations = allAnime.filter(anime => 
              anime.myanimelist_id !== searchedAnime.myanimelist_id &&
              anime.genres.some(genre => searchedAnime.genres.includes(genre))
            );

            if (!recommendations.length) {
              return {
                choices: [{
                  message: {
                    content: `No recommendations found for "${searchedAnime.title}". Try another anime.`
                  }
                }]
              };
            }

            //this shuffles and limits recommendations
            recommendations = this.shuffleArray(recommendations).slice(0, 6);

            //this formats recommendations into HTML
            const formattedRecommendations = recommendations.map(anime => `
              <div class="anime-card">
                <div class="anime-image">
                  <img src="${anime.picture_url}" alt="${anime.title}">
                  <div class="score-badge">★ ${anime.score}</div>
                </div>
                <div class="anime-info">
                  <h3>${anime.title}</h3>
                  <div class="meta-info">
                    <span>${anime.type}</span>
                    <span>${anime.episodes} episodes</span>
                  </div>
                  <div class="genres-list">${anime.genres.join(' • ')}</div>
                  <ion-button class="add-to-list">ADD TO LIST</ion-button>
                </div>
              </div>
            `).join('');

            //this returns the formatted response with search result and recommendations
            return {
              choices: [{
                message: {
                  content: `
                    <div class="recommendations-container">
                      <div class="search-result glass-card">
                        <div class="result-info">
                          <img src="${searchedAnime.picture_url}" alt="${searchedAnime.title}">
                          <div class="info-text">
                            <h2>${searchedAnime.title}</h2>
                            <div class="genres">${searchedAnime.genres.join(' • ')}</div>
                          </div>
                        </div>
                      </div>
                      <div class="anime-grid">
                        ${formattedRecommendations}
                      </div>
                    </div>
                  `
                }
              }]
            };
          })
        );
      })
    );
  }
} 