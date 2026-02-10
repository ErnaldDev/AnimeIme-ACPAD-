//service responsible for handling authentication operations including user registration, authentication, password reset, and sign out
import { Injectable } from '@angular/core';
import { 
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  setPersistence,
  browserLocalPersistence
} from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';
import { 
  Firestore,
  collection,
  query,
  where,
  getDocs,
  limit,
  doc,
  setDoc,
  getDoc
} from '@angular/fire/firestore';
import { UserProfile } from '../interfaces/user.interface';
import { Router } from '@angular/router';

//interface for authentication request data
interface UserCredential {
  email: string;
  password: string;
  username?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  //subject to track current user state
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  //initializes the AuthService with required dependencies
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {
    //set persistence to LOCAL
    setPersistence(this.auth, browserLocalPersistence);
    
    //listen to auth state changes
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSubject.next(user);
    });
  }

  //checks if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  //gets current user information
  getCurrentUser(): User | null {
    return this.auth.currentUser || this.currentUserSubject.value;
  }

  //registers a new user with email, password, and optional username
  async registerUser({ email, password, username }: UserCredential) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      //create user profile structure
      const userProfile = {
        uid: userCredential.user.uid,
        email: email,
        username: username || email.split('@')[0],
        photoURL: null,
        joinDate: new Date(),
        lastOnline: new Date()
      };

      //save to Firestore
      await setDoc(doc(this.firestore, `users/${userCredential.user.uid}`), userProfile);

      return userCredential.user;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  //authenticates user with email and password
  async authenticateUser({ email, password }: UserCredential) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  //logs in user with optional remember me functionality
  async login(userData: any, rememberMe: boolean = false) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        userData.email,
        userData.password
      );
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(userCredential.user));
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  //signs out the current user
  async signOutUser(): Promise<void> {
    try {
      await signOut(this.auth);
      localStorage.clear();
      sessionStorage.clear();
      this.router.navigate(['/login']);
    } catch (error) {
      throw error;
    }
  }

  //searches for users based on username query
  async searchUsers(searchQuery: string): Promise<UserProfile[]> {
    try {
      if (!searchQuery) return [];
      
      const usersRef = collection(this.firestore, 'users');
      const lowercaseQuery = searchQuery.toLowerCase();
      
      //create a query that searches for usernames that start with the search query
      const q = query(
        usersRef,
        where('username', '>=', lowercaseQuery),
        where('username', '<=', lowercaseQuery + '\uf8ff'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as UserProfile));

      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  //gets or creates user profile by UID
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(this.firestore, `users/${uid}`));
      
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as UserProfile;
      }
      
      //if profile doesn't exist, create it
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.uid === uid) {
        const newProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email!,
          username: currentUser.email!.split('@')[0],
          photoURL: currentUser.photoURL,
          joinDate: new Date(),
          lastOnline: new Date()
        };
        await setDoc(doc(this.firestore, `users/${uid}`), newProfile);
        return newProfile;
      }

      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  //creates a new user profile in Firestore
  async createUserProfile(user: any) {
    try {
      const userRef = doc(this.firestore, `users/${user.uid}`);
      const userData = {
        uid: user.uid,
        email: user.email,
        username: user.username || user.email.split('@')[0],
        photoURL: user.photoURL || null,
        joinDate: new Date(),
        lastOnline: new Date()
      };
      await setDoc(userRef, userData);
      return userData;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }
}