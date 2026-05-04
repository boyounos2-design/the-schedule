import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch additional user data (role, etc.) from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              ...userDoc.data()
            };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            console.error('User profile not found in Firestore');
            setUser(null);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setUser(null);
        }
      } else {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token'); // Firebase handles this, but keep for cleanup
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async (username, password) => {
    // We used a dummy email format for login: username@hospital.com
    const email = `${username.toLowerCase().trim()}@hospital.com`;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const value = {
    user,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
