//defines the structure for user profile data
export interface UserProfile {
  id?: string;              //unique identifier for the user
  uid?: string;             //Firebase auth user ID
  email: string;            //user's email address
  username: string;         //user's display name
  photoURL: string | null;  //URL to user's profile picture
  joinDate: Date;          //when the user joined the platform
  lastOnline: Date;        //user's last activity timestamp
} 