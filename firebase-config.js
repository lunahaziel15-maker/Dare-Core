window.DARECORE_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDW2RFAShT6tnKV-tPMaSmE_DtjvHoGPRI",
  authDomain: "dare-core-web.firebaseapp.com",
  databaseURL: "https://dare-core-web-default-rtdb.firebaseio.com",
  projectId: "dare-core-web",
  storageBucket: "dare-core-web.firebasestorage.app",
  messagingSenderId: "160010293216",
  appId: "1:160010293216:web:3babdae0e3e80f18dfe585",
  measurementId: "G-LESMYFSKDH"
};

(function () {
  try {
    if (window.firebase && typeof window.firebase.initializeApp === "function") {
      if (!window.firebase.apps || !window.firebase.apps.length) {
        window.firebase.initializeApp(window.DARECORE_FIREBASE_CONFIG);
      }
      if (typeof window.firebase.firestore === "function") {
        window.db = window.firebase.firestore();
      }
    }
  } catch (err) {
    console.warn("Firebase init notice:", err);
  }
})();