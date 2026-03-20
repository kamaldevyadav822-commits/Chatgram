import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc
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
} catch (error) {
  alert("Login Failed: " + error.message);
  throw new Error("Auth Error");
}

// 🚫 Restrict users
email = email.trim().toLowerCase();
const allowedUsers = ["seltos1@gmail.com", "seltos@gmail.com"];

if (!allowedUsers.includes(email)) {
  alert("Access Denied");
  throw new Error("Unauthorized");
}

// 📦 DOM
const chat = document.getElementById("chat");
const input = document.getElementById("msg");

// 📤 SEND MESSAGE
window.sendMessage = async function () {
  const text = input.value.trim();
  if (!text) return;

  try {
    await addDoc(collection(db, "messages"), {
      text: text,
      sender: email,
      timestamp: serverTimestamp(),
      seen: false
    });

    input.value = "";
  } catch (err) {
    console.error("Send error:", err);
  }
};

// ⌨️ ENTER KEY SUPPORT
input.addEventListener("keypress", function (e) {
  if (e.key === "Enter") sendMessage();
});

// 🎯 DISPLAY MESSAGE
function displayMessage(msg) {
  if (!msg.timestamp) return;

  const isMe = msg.sender === email;

  const wrapper = document.createElement("div");
  wrapper.className = `flex flex-col ${isMe ? "items-end" : "items-start"}`;

  wrapper.innerHTML = `
    <div class="
      max-w-[75%] px-4 py-2 rounded-2xl text-sm break-words shadow-md
      ${isMe
        ? "bg-blue-500 text-white rounded-br-none"
        : "bg-white/20 backdrop-blur-md text-white rounded-bl-none border border-white/20"}
    ">
      ${msg.text}
    </div>
    ${
      isMe
        ? `<span class="text-[10px] mt-1 text-gray-400">
            ${msg.seen ? "👁 Seen" : "✓ Sent"}
          </span>`
        : ""
    }
  `;

  chat.appendChild(wrapper);
}

// 📥 REAL-TIME SYNC (FULL RENDER - FIXED BUG)
const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));

onSnapshot(q, async (snapshot) => {
  chat.innerHTML = ""; // reset cleanly

  for (const docSnap of snapshot.docs) {
    const msg = docSnap.data();
    const id = docSnap.id;

    displayMessage(msg);

    // 👁 mark as seen
    if (msg.sender !== email && !msg.seen) {
      try {
        await updateDoc(doc(db, "messages", id), {
          seen: true
        });
      } catch (e) {
        console.error("Seen update error:", e);
      }
    }
  }

  chat.scrollTop = chat.scrollHeight;
});

// 🔥 AUTO FOCUS
window.onload = () => {
  input.focus();
};
