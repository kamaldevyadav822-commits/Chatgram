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
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

// CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCeM_ki1k6hRW4Y3ooog5yUt9wQp4EGvEs",
  authDomain: "chatgram-aab01.firebaseapp.com",
  projectId: "chatgram-aab01",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM
const loginScreen = document.getElementById("loginScreen");
const chatScreen = document.getElementById("chatScreen");
const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const typingDiv = document.getElementById("typing");
const statusDiv = document.getElementById("status");
const avatar = document.getElementById("avatar");
const menu = document.getElementById("menu");
const nicknameDisplay = document.getElementById("nicknameDisplay");

let email = "";

// LOGIN
window.login = async function () {
  const e = document.getElementById("email").value;
  const p = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, e, p);

    email = e.trim().toLowerCase();

    const allowedUsers = ["seltos1@gmail.com", "seltos@gmail.com"];
    if (!allowedUsers.includes(email)) throw "Unauthorized";

    // Nickname setup
    let nickname = localStorage.getItem("nickname");

    if (!nickname) {
      nickname = prompt("Enter your nickname:");
      localStorage.setItem("nickname", nickname);
    }

    avatar.innerText = nickname.charAt(0).toUpperCase();
    nicknameDisplay.innerText = nickname;

    loginScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");

    startChat();

  } catch (err) {
    alert("Login failed");
  }
};

// DROPDOWN
avatar.addEventListener("click", () => {
  menu.classList.toggle("hidden");
});

// LOGOUT
window.logout = function () {
  localStorage.removeItem("nickname");
  location.reload();
};

// START CHAT
function startChat() {

  const other = email === "seltos1@gmail.com"
    ? "seltos@gmail.com"
    : "seltos1@gmail.com";

  // ONLINE
  setDoc(doc(db, "presence", email), {
    online: true,
    typing: false
  });

  // LISTEN OTHER STATUS
  onSnapshot(doc(db, "presence", other), (snap) => {
    const data = snap.data();
    if (!data) return;

    statusDiv.innerText = data.online ? "Online" : "Offline";
    typingDiv.style.display = data.typing ? "block" : "none";
  });

  // SEND MESSAGE
  window.sendMessage = async function () {
    const text = input.value.trim();
    if (!text) return;

    const btn = document.getElementById("sendBtn");
    btn.classList.add("scale-90");

    await addDoc(collection(db, "messages"), {
      text,
      sender: email,
      timestamp: serverTimestamp(),
      seen: false
    });

    input.value = "";

    setTimeout(() => btn.classList.remove("scale-90"), 100);
  };

  // TYPING
  input.addEventListener("input", async () => {
    await updateDoc(doc(db, "presence", email), {
      typing: input.value.length > 0
    });
  });

  // ENTER
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // CHAT LISTENER
  const q = query(collection(db, "messages"), orderBy("timestamp"));

  onSnapshot(q, async (snapshot) => {
    chat.innerHTML = "";

    for (const d of snapshot.docs) {
      const msg = d.data();
      const id = d.id;

      const isMe = msg.sender === email;

      const div = document.createElement("div");
      div.className = `flex flex-col ${isMe ? "items-end" : "items-start"}`;

      div.innerHTML = `
        <div class="px-4 py-2 rounded-2xl text-sm max-w-[75%]
          ${isMe ? "bg-blue-500 text-white" : "bg-white/20 text-white"}">
          ${msg.text}
        </div>
        ${isMe ? `<span class="text-xs text-gray-400">
          ${msg.seen ? "👁 Seen" : "✓ Sent"}
        </span>` : ""}
      `;

      chat.appendChild(div);

      if (msg.sender !== email && !msg.seen) {
        await updateDoc(doc(db, "messages", id), { seen: true });
      }
    }

    chat.scrollTop = chat.scrollHeight;
  });

  // OFFLINE
  window.addEventListener("beforeunload", () => {
    setDoc(doc(db, "presence", email), {
      online: false,
      typing: false
    });
  });
}
