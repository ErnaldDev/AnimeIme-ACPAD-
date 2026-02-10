import { Timestamp } from '@firebase/firestore';

//defines the structure for basic anime data
export interface AnimeData {
  myanimelist_id: string;
  title: string;
  picture_url: string;
  image_url: string;
  imageUrl: string;
  genres: string[];
  type: string;
  episodes: number;
  score: number;
  images?: {
    jpg: {
      image_url: string;
    };
  };
}

//defines the structure for Jikan API response data
export interface JikanResponse {
  data: {
    mal_id: number;
    title: string;
    title_english: string | null;
    title_japanese: string | null;
    episodes: number;
    images: {
      jpg: {
        image_url: string;
      };
    };
    type: string;
    score: number;
    genres: {
      mal_id: number;
      name: string;
    }[];
  }[];
}

//defines the structure for user's anime list items
export interface AnimeListItem {
  id: string;                  //unique identifier for the list item
  animeId: string;            //MAL anime identifier
  title: string;              //anime title
  rating: number;             //user's rating
  addedAt: Timestamp;         //when the anime was added to the list
  status: string;             //watching status (watching, completed, etc.)
  image: string;              //anime cover image URL
  totalEpisodes: number;      //total number of episodes
  progress: number;           //number of episodes watched
  type: string;               //anime type (TV, Movie, etc.)
  synopsis?: string;          //optional anime synopsis
  score?: number;             //optional MAL score
} 