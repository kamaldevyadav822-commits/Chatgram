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

// 🔥 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCeM_ki1k6hRW4Y3ooog5yUt9wQp4EGvEs",
  authDomain: "chatgram-aab01.firebaseapp.com",
  projectId: "chatgram-aab01",
  storageBucket: "chatgram-aab01.firebasestorage.app",
  messagingSenderId: "717348134788",
  appId: "1:717348134788:web:7d24d2e440b198b97707d1"
};

// 🚀 Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 🔐 LOGIN
let email = prompt("Enter your email:");
let password = prompt("Enter your password:");

try {
  await signInWithEmailAndPassword(auth, email, password);
  console.log("Logged in as:", email);
} catch (error) {
  alert("Login Failed: " + error.message);
  throw new Error("Auth Error");
}

// 🚫 Restrict users
const allowedUsers = ["seltos1@gmail.com", "seltos@gmail.com"];

email = email.trim().toLowerCase();

if (!allowedUsers.includes(email)) {
  alert("Access Denied");
  throw new Error("Unauthorized");
}

// 📦 DOM
const chat = document.getElementById("chat");
const input = document.getElementById("msg");

// 👤 Username mapping (clean UI)
const usernames = {
  "seltos1@gmail.com": "You",
  "seltos@gmail.com": "Partner"
};

// 📤 SEND MESSAGE
window.sendMessage = async function () {
  const text = input.value.trim();
  if (!text) return;

  try {
    await addDoc(collection(db, "messages"), {
      text: text,
      sender: email,
      timestamp: serverTimestamp()
    });

    input.value = "";
  } catch (error) {
    console.error("Send error:", error);
  }
};

// ⌨️ ENTER KEY SUPPORT
input.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// 🎯 DISPLAY MESSAGE (UI)
function displayMessage(msg) {
  if (!msg.timestamp) return;

  const isMe = msg.sender === email;

  const wrapper = document.createElement("div");
  wrapper.className = `flex ${isMe ? "justify-end" : "justify-start"}`;

  wrapper.innerHTML = `
    <div class="
      max-w-[75%] px-4 py-2 rounded-2xl text-sm
      ${isMe
        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-none"
        : "bg-white/10 backdrop-blur-md text-white rounded-bl-none"}
    ">
      ${msg.text}
    </div>
  `;

  chat.appendChild(wrapper);
  chat.scrollTop = chat.scrollHeight;
}

// 📥 REAL-TIME LISTENER (NO FLICKER)
const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));

onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === "added") {
      displayMessage(change.doc.data());
    }
  });
});

// 🔥 AUTO FOCUS
window.onload = () => {
  input.focus();
};
