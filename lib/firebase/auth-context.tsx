"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// User profile data
interface UserProfile {
  username?: string;
  birthYear?: number;
  occupation?: string;
  secretQuestion?: string;
  secretAnswer?: string;
}

// Demo user type that matches Firebase User interface for essential properties
interface DemoUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  profile?: UserProfile;
}

interface AuthContextType {
  user: DemoUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profile?: UserProfile) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  demoSignIn: () => void;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: DemoUser = {
  uid: "demo-user-123",
  email: "demo@example.com",
  displayName: "デモユーザー",
  profile: {
    username: "demo_user",
    birthYear: 1990,
    occupation: "other",
  },
};

// Check if Firebase is configured
const isFirebaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Check for demo session in localStorage
    const demoSession = localStorage.getItem("demo-session");
    if (demoSession === "true") {
      setUser(DEMO_USER);
      setIsDemo(true);
    }
    setLoading(false);

    // If Firebase is configured, use real auth
    if (isFirebaseConfigured()) {
      import("./config").then(({ auth }) => {
        import("firebase/auth").then(({ onAuthStateChanged }) => {
          const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
              // Get user profile from Firestore
              let profile: UserProfile | undefined;
              try {
                const { db } = await import("./config");
                const { doc, getDoc } = await import("firebase/firestore");
                const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                if (userDoc.exists()) {
                  const data = userDoc.data();
                  profile = {
                    username: data.username,
                    birthYear: data.birthYear,
                    occupation: data.occupation,
                    secretQuestion: data.secretQuestion,
                  };
                }
              } catch (e) {
                console.error("Failed to load user profile:", e);
              }
              
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                profile,
              });
              setIsDemo(false);
            } else if (!demoSession) {
              setUser(null);
            }
            setLoading(false);
          });
          return () => unsubscribe();
        });
      });
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isFirebaseConfigured()) {
      throw new Error("Firebase is not configured. Use demo mode instead.");
    }
    const { auth } = await import("./config");
    const { signInWithEmailAndPassword } = await import("firebase/auth");
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // Get user profile
    let profile: UserProfile | undefined;
    try {
      const { db } = await import("./config");
      const { doc, getDoc } = await import("firebase/firestore");
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        profile = {
          username: data.username,
          birthYear: data.birthYear,
          occupation: data.occupation,
          secretQuestion: data.secretQuestion,
        };
      }
    } catch (e) {
      console.error("Failed to load user profile:", e);
    }
    
    setUser({
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      profile,
    });
    setIsDemo(false);
  };

  const signUp = async (email: string, password: string, profile?: UserProfile) => {
    if (!isFirebaseConfigured()) {
      throw new Error("Firebase is not configured. Use demo mode instead.");
    }
    const { auth, db } = await import("./config");
    const { createUserWithEmailAndPassword } = await import("firebase/auth");
    const { doc, setDoc } = await import("firebase/firestore");
    
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Save user profile to Firestore
    if (profile) {
      await setDoc(doc(db, "users", result.user.uid), {
        email: result.user.email,
        username: profile.username?.toLowerCase(),
        birthYear: profile.birthYear,
        occupation: profile.occupation,
        secretQuestion: profile.secretQuestion,
        secretAnswer: profile.secretAnswer,
        createdAt: new Date(),
      });
    }
    
    setUser({
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      profile,
    });
    setIsDemo(false);
  };

  const signOut = async () => {
    if (isDemo) {
      localStorage.removeItem("demo-session");
      setUser(null);
      setIsDemo(false);
      return;
    }
    if (isFirebaseConfigured()) {
      const { auth } = await import("./config");
      const { signOut: firebaseSignOut } = await import("firebase/auth");
      await firebaseSignOut(auth);
    }
    setUser(null);
  };

  const demoSignIn = () => {
    localStorage.setItem("demo-session", "true");
    setUser(DEMO_USER);
    setIsDemo(true);
  };

  const deleteAccount = async () => {
    if (isDemo) {
      localStorage.removeItem("demo-session");
      setUser(null);
      setIsDemo(false);
      return;
    }
    
    if (!isFirebaseConfigured() || !user) {
      throw new Error("Cannot delete account");
    }
    
    const { auth, db } = await import("./config");
    const { deleteUser } = await import("firebase/auth");
    const { doc, deleteDoc, collection, getDocs, writeBatch } = await import("firebase/firestore");
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No user logged in");
    }
    
    // Delete user data from Firestore
    const batch = writeBatch(db);
    
    // Delete user profile
    batch.delete(doc(db, "users", currentUser.uid));
    
    // Delete learning history
    const historySnapshot = await getDocs(collection(db, "users", currentUser.uid, "learningHistory"));
    historySnapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    
    // Delete bookmarks
    const bookmarksSnapshot = await getDocs(collection(db, "users", currentUser.uid, "bookmarks"));
    bookmarksSnapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    
    await batch.commit();
    
    // Delete Firebase Auth user
    await deleteUser(currentUser);
    
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, deleteAccount, demoSignIn, isDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
