import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, getDocFromServer, enableNetwork, disableNetwork } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/user.gender.read');

// Error Handling Helper
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };

  // Log to console for debugging
  console.error(`[Firestore ${operationType.toUpperCase()}] at ${path}:`, errorMessage);
  
  // If it's a connectivity issue, we might want to suggest checking config
  if (errorMessage.toLowerCase().includes('offline') || errorMessage.toLowerCase().includes('unreachable')) {
    console.warn("Firestore appears to be offline. Data will be synced once connection is restored.");
  }

  // Throw structured error for components to catch and display in ErrorBoundary if needed
  throw new Error(JSON.stringify(errInfo));
}

// Check Connection Status
export async function checkConnection(): Promise<boolean> {
  try {
    // Try to get a non-existent document from server to check real connectivity
    await getDocFromServer(doc(db, '_internal_', 'health_check'));
    return true;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('offline') || error.message.includes('permission-denied'))) {
      // Permission denied still means we reached the server
      return error.message.includes('permission-denied');
    }
    return false;
  }
}

// Initial connection check (don't block)
checkConnection().then(connected => {
  if (!connected) {
    console.warn("Could not reach Firestore servers. The app will work in offline mode.");
  } else {
    console.log("Firestore connection verified.");
  }
});

export { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  enableNetwork,
  disableNetwork 
};
