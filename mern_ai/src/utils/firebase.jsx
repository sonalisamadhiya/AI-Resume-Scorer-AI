
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from 'firebase/auth';

const firebaseConfig={
  apiKey: "AIzaSyD8UEKmj-7LxQPIu2JsTB1a93bU7PlYjs0",
  authDomain: "mernai-52f31.firebaseapp.com",
  projectId: "mernai-52f31",
  storageBucket: "mernai-52f31.firebasestorage.app",
  messagingSenderId: "10024293230",
  appId: "1:10024293230:web:60cbde3e5df3712ab1a77f",
  measurementId: "G-7K7M4V79ND"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export {auth, provider};
