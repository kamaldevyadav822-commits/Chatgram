import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  onSnapshot,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

// ✅ FIREBASE CONFIG (your existing project)
const firebaseConfig = {
  apiKey: "AIzaSyCeM_ki1k6hRW4Y3ooog5yUt9wQp4EGvEs",
  authDomain: "chatgram-aab01.firebaseapp.com",
  projectId: "chatgram-aab01",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = "";
let currentChat = "";

// 🔥 CLOUDINARY UPLOAD (FIXED WITH YOUR CLOUD NAME)
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "chatgram_upload");

  const res = await fetch("https://api.cloudinary.com/v1_1/dp6iehb5j/image/upload", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  return data.secure_url;
}

// 🔐 LOGIN
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const nickname = document.getElementById("nickname").value;
  const file = document.getElementById("avatarInput").files[0];

  await signInWithEmailAndPassword(auth, email, password);

  currentUser = email;

  let avatarURL = "";

  if (file) {
    avatarURL = await uploadToCloudinary(file);
  }

  // ✅ Merge prevents overwriting old users
  await setDoc(doc(db, "users", email), {
    email,
    nickname: nickname || email,
    avatar: avatarURL || ""
  }, { merge: true });

  loadUsers();

  document.getElementById("login").classList.add("hidden");
  document.getElementById("chatList").classList.remove("hidden");
};

// 👥 LOAD USERS
async function loadUsers() {
  const snap = await getDocs(collection(db, "users"));
  const container = document.getElementById("usersList");

  container.innerHTML = "";

  snap.forEach(docSnap => {
    const user = docSnap.data();

    if (user.email === currentUser) return;

    const div = document.createElement("div");
    div.className = "flex items-center gap-2 p-2 border-b cursor-pointer";

    div.innerHTML = `
      <img src="${user.avatar || 'https://via.placeholder.com/40'}"
           class="w-8 h-8 rounded-full object-cover">
      <span>${user.nickname}</span>
    `;

    div.onclick = () => openChat(user.email);

    container.appendChild(div);
  });
}

// 💬 OPEN CHAT
window.openChat = function (otherUser) {
  currentChat = [currentUser, otherUser].sort().join("_");

  document.getElementById("chatList").classList.add("hidden");
  document.getElementById("chatScreen").classList.remove("hidden");

  document.getElementById("chatHeader").innerText = otherUser;

  loadMessages();
};

// 📥 LOAD MESSAGES
function loadMessages() {
  const q = query(collection(db, "messages"), where("chatId", "==", currentChat));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("messages");
    box.innerHTML = "";

    snap.forEach(docSnap => {
      const m = docSnap.data();
      const isMe = m.sender === currentUser;

      const div = document.createElement("div");

      div.className = `flex ${isMe ? "justify-end" : "justify-start"}`;

      div.innerHTML = `
        <div class="px-3 py-2 rounded-xl max-w-[70%]
          ${isMe ? "bg-blue-500 text-white" : "bg-white/20 text-white"}">
          ${m.text}
        </div>
      `;

      box.appendChild(div);
    });

    box.scrollTop = box.scrollHeight;
  });
}

// 📤 SEND MESSAGE
window.sendMessage = async function () {
  const input = document.getElementById("msg");
  const text = input.value.trim();

  if (!text) return;

  await addDoc(collection(db, "messages"), {
    text,
    sender: currentUser,
    chatId: currentChat
  });

  input.value = "";
};
