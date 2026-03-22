import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";

import {
  getFirestore, collection, addDoc, getDocs,
  doc, setDoc, onSnapshot, query, where, updateDoc
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

import {
  getAuth, signInWithEmailAndPassword,
  onAuthStateChanged, setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

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
let usersCache = {};

setPersistence(auth, browserLocalPersistence);

// 🔥 ONLINE STATUS
function updateOnlineStatus() {
  updateDoc(doc(db, "users", currentUser), {
    lastActive: Date.now()
  });
}

setInterval(updateOnlineStatus, 5000);

// LOGIN
window.login = async function () {
  const email = email.value;
  const password = password.value;

  await signInWithEmailAndPassword(auth, email, password);

  currentUser = email;

  await setDoc(doc(db, "users", email), {
    email,
    nickname: email
  }, { merge: true });
};

// AUTO LOGIN
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user.email;

    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("chatList").classList.remove("hidden");

    loadUsers();
  }
});

// USERS + LAST MESSAGE
async function loadUsers() {
  const snap = await getDocs(collection(db, "users"));
  const container = document.getElementById("usersList");

  container.innerHTML = "";

  snap.forEach(docSnap => {
    const user = docSnap.data();
    usersCache[user.email] = user;

    if (user.email === currentUser) return;

    const div = document.createElement("div");

    div.innerHTML = `
      <div onclick="openChat('${user.email}')" class="p-3 border-b">
        <div>${user.nickname}</div>
        <div id="last-${user.email}" class="text-xs text-gray-400">...</div>
      </div>
    `;

    container.appendChild(div);

    // 🔥 LAST MESSAGE
    const q = query(collection(db, "messages"), where("chatId", "==", [currentUser, user.email].sort().join("_")));

    onSnapshot(q, (snap) => {
      let msgs = [];
      snap.forEach(d => msgs.push(d.data()));

      msgs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      if (msgs[0]) {
        document.getElementById(`last-${user.email}`).innerText =
          msgs[0].text || "📷 Image";
      }
    });
  });
}

// OPEN CHAT
window.openChat = function (otherUser) {
  currentChat = [currentUser, otherUser].sort().join("_");

  document.getElementById("chatList").classList.add("hidden");
  document.getElementById("chatScreen").classList.remove("hidden");

  document.getElementById("chatHeader").innerText = usersCache[otherUser]?.nickname;

  // 🔥 ONLINE STATUS
  setInterval(() => {
    const last = usersCache[otherUser]?.lastActive || 0;
    const online = Date.now() - last < 10000;

    document.getElementById("status").innerText = online ? "Online" : "Offline";
  }, 3000);

  loadMessages();
};

// IMAGE PREVIEW
const imageInput = document.getElementById("imageInput");
const previewBox = document.getElementById("previewBox");
const previewImg = document.getElementById("previewImg");

imageInput.onchange = () => {
  const file = imageInput.files[0];
  if (!file) return;

  previewImg.src = URL.createObjectURL(file);
  previewBox.classList.remove("hidden");
};

// LOAD MESSAGES
function loadMessages() {
  const q = query(collection(db, "messages"), where("chatId", "==", currentChat));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("messages");
    box.innerHTML = "";

    let messages = [];

    snap.forEach(d => messages.push(d.data()));

    messages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    messages.forEach(m => {
      const isMe = m.sender === currentUser;

      const div = document.createElement("div");

      div.className = isMe ? "text-right" : "text-left";

      div.innerHTML = `
        ${m.text || ""}
        ${m.image ? `<img src="${m.image}" class="max-w-[150px] mt-1 rounded">` : ""}
      `;

      box.appendChild(div);
    });

    box.scrollTop = box.scrollHeight;
  });
}

// SEND
window.sendMessage = async function () {
  const text = msg.value;
  const file = imageInput.files[0];

  let imageURL = "";

  if (file) {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", "chatgram_upload");

    const res = await fetch("https://api.cloudinary.com/v1_1/dp6iehb5j/image/upload", {
      method: "POST",
      body: form
    });

    const data = await res.json();
    imageURL = data.secure_url;
  }

  await addDoc(collection(db, "messages"), {
    text,
    image: imageURL,
    sender: currentUser,
    chatId: currentChat,
    createdAt: Date.now()
  });

  msg.value = "";
  imageInput.value = "";
  previewBox.classList.add("hidden");
};

// BACK
window.goBack = function () {
  document.getElementById("chatScreen").classList.add("hidden");
  document.getElementById("chatList").classList.remove("hidden");
};
