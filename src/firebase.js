// import and configure firebase
import * as firebase from 'firebase';
require('../secrets.js')

const firebaseConfig = {
  apiKey: process.env.FIREBASE_KEY,
  authDomain: "sill-6b919.firebaseapp.com",
  databaseURL: "https://sill-6b919.firebaseio.com",
  storageBucket: "",
}
export const firebaseApp = firebase.initializeApp(firebaseConfig)
