import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";

import {
  getFirestore, collection, addDoc, getDocs,
  doc, setDoc, onSnapshot, query, where, updateDoc
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

import {
  getAuth, signInWithEmailAndPassword,
  onAuthStateChanged, setPersistence,
  browserLocalPersistence, signOut
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

// LOGIN
window.login = async function () {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) return alert("Fill all fields");

  try {
    await signInWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", email), {
      email,
      nickname: email
    }, { merge: true });

  } catch (err) {
    alert(err.message);
  }
};

// AUTO LOGIN
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user.email;

    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("chatList").classList.remove("hidden");

    loadUsers();
    setInterval(updateOnlineStatus, 5000);
  }
});

// ONLINE STATUS
function updateOnlineStatus() {
  updateDoc(doc(db, "users", currentUser), {
    lastActive: Date.now()
  });
}

// USERS
async function loadUsers() {
  const snap = await getDocs(collection(db, "users"));
  const container = document.getElementById("usersList");

  container.innerHTML = "";

  snap.forEach(docSnap => {
    const user = docSnap.data();
    usersCache[user.email] = user;

    if (user.email === currentUser) return;

    const div = document.createElement("div");

    div.className = "p-3 border-b cursor-pointer";

    div.innerHTML = `<div>${user.nickname}</div>`;

    div.onclick = () => openChat(user.email);

    container.appendChild(div);
  });
}

// OPEN CHAT
window.openChat = function (otherUser) {
  currentChat = [currentUser, otherUser].sort().join("_");

  document.getElementById("chatList").classList.add("hidden");
  document.getElementById("chatScreen").classList.remove("hidden");

  document.getElementById("chatHeader").innerText = usersCache[otherUser]?.nickname;

  loadMessages();
};

// BACK
window.goBack = function () {
  document.getElementById("chatScreen").classList.add("hidden");
  document.getElementById("chatList").classList.remove("hidden");
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

// LOAD MESSAGES (FIXED UI)
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

      div.className = `flex ${isMe ? "justify-end" : "justify-start"}`;

      div.innerHTML = `
        <div class="px-3 py-2 rounded-xl max-w-[70%]
          ${isMe ? "bg-blue-500 text-white" : "bg-white/20 text-white"}">

          ${m.text || ""}
          ${m.image ? `<img src="${m.image}" class="mt-2 rounded max-w-full">` : ""}

        </div>
      `;

      box.appendChild(div);
    });

    box.scrollTop = box.scrollHeight;
  });
}

// SEND
window.sendMessage = async function () {
  const text = document.getElementById("msg").value.trim();
  const file = imageInput.files[0];

  if (!text && !file) return;

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

  document.getElementById("msg").value = "";
  imageInput.value = "";
  previewBox.classList.add("hidden");
};
