import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

// 🔥 YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCeM_ki1k6hRW4Y3ooog5yUt9wQp4EGvEs",
  authDomain: "chatgram-aab01.firebaseapp.com",
  projectId: "chatgram-aab01",
  storageBucket: "chatgram-aab01.firebasestorage.app",
  messagingSenderId: "717348134788",
  appId: "1:717348134788:web:7d24d2e440b198b97707d1"
};

// 🚀 Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 🔐 LOGIN SYSTEM
let email = prompt("Enter your email:");
let password = prompt("Enter your password:");

try {
  await signInWithEmailAndPassword(auth, email, password);
} catch (error) {
  alert("Login Failed: " + error.message);
  throw new Error("Auth Error");
}

// 🚫 ALLOW ONLY 2 USERS
const allowedUsers = ["seltos@gmail.com", "seltos1gmail.com"];

if (!allowedUsers.includes(email)) {
  alert("Access Denied");
  throw new Error("Unauthorized user");
}

// 📤 SEND MESSAGE
window.sendMessage = async function () {
  const input = document.getElementById("msg");

  if (!input.value.trim()) return;

  try {
    await addDoc(collection(db, "messages"), {
      text: input.value,
      sender: email,
      timestamp: serverTimestamp()
    });

    input.value = "";
  } catch (error) {
    console.error("Send error:", error);
  }
};

// 📥 RECEIVE MESSAGES (REAL-TIME)
const chat = document.getElementById("chat");

const q = query(collection(db, "messages"), orderBy("timestamp"));

onSnapshot(q, (snapshot) => {
  chat.innerHTML = "";

  snapshot.forEach(doc => {
    const msg = doc.data();

    const div = document.createElement("div");

    // Style differentiation
    if (msg.sender === email) {
      div.style.textAlign = "right";
      div.style.color = "#00ffcc";
    } else {
      div.style.textAlign = "left";
      div.style.color = "#ffffff";
    }

    div.innerText = msg.sender + ": " + msg.text;

    chat.appendChild(div);
  });

  chat.scrollTop = chat.scrollHeight;
});
