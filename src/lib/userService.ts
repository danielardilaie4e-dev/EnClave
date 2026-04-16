import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db, storage } from './firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { SubscriptionPlan } from './subscriptionPlans';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export type SocialPlatform = 'facebook' | 'instagram' | 'x' | 'tiktok';

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export interface PortfolioItem {
  id: string;
  type: 'image' | 'video' | 'document';
  title: string;
  url?: string;
  fileDataUrl?: string;
  fileName?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'musician' | 'employer' | 'admin';
  documentId?: string;
  age?: number;
  password?: string; // Note: In a real app, passwords shouldn't be in Firestore, but keeping for compatibility with your current UI
  phone?: string;
  socialLinks?: SocialLink[];
  portfolio?: PortfolioItem[];
  bio?: string;
  location?: string;
  address?: string;
  establishmentType?: string;
  hasAgeRestriction?: boolean;
  minEntryAge?: number;
  maxEntryAge?: number;
  verified?: boolean;
  rating?: number;
  reviewCount?: number;
  subscription?: SubscriptionPlan;
  createdAt?: any;
}

export const getUserProfile = async (uid: string) => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

export const findUserByEmail = async (email: string) => {
  const q = query(collection(db, 'users'), where('email', '==', normalizeEmail(email)));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data() as UserProfile;
  }
  return null;
};

export const authenticateUser = async (email: string, password: string) => {
  const profile = await findUserByEmail(email);
  if (!profile) return null;
  return profile.password === password ? profile : null;
};

export const createUserProfile = async (profile: UserProfile) => {
  const docRef = doc(db, 'users', profile.uid);
  const existingProfileByUid = await getDoc(docRef);

  if (existingProfileByUid.exists()) {
    const error = new Error('El perfil ya existe para este usuario.') as Error & { code?: string };
    error.code = 'profile/already-exists';
    throw error;
  }

  const normalizedEmail = normalizeEmail(profile.email);
  const existingProfileByEmail = await findUserByEmail(normalizedEmail);

  if (existingProfileByEmail && existingProfileByEmail.uid !== profile.uid) {
    const error = new Error('El correo ya esta en uso por otro perfil.') as Error & { code?: string };
    error.code = 'profile/email-already-in-use';
    throw error;
  }
  
  // Firestore does not support 'undefined' values. 
  // We convert the profile object to a plain object and remove undefined fields.
  const data = JSON.parse(JSON.stringify({
    ...profile,
    email: normalizedEmail,
    createdAt: serverTimestamp(),
    verified: false,
    rating: 0,
    reviewCount: 0,
    subscription: profile.subscription || 'free',
  }));

  await setDoc(docRef, data);
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  const docRef = doc(db, 'users', uid);
  
  // Remove undefined fields
  const cleanData = JSON.parse(JSON.stringify(data));
  
  await updateDoc(docRef, cleanData);
};

export const uploadPortfolioAsset = async (uid: string, itemId: string, fileName: string, blob: Blob) => {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const objectRef = ref(storage, `users/${uid}/portfolio/${itemId}-${Date.now()}-${safeName}`);
  await uploadBytes(objectRef, blob);
  return getDownloadURL(objectRef);
};
