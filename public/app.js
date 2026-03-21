import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";

import {
  getFirestore, collection, addDoc, getDocs,
  doc, setDoc, onSnapshot, query, where, updateDoc
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signOut
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

// KEEP LOGIN
setPersistence(auth, browserLocalPersistence);

// CLOUDINARY
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

// AUTO LOGIN
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user.email;

    setupProfile();

    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("chatList").classList.remove("hidden");

    loadUsers();
  }
});

// LOGIN
window.login = async function () {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Fill all fields");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);

    let nickname = prompt("Enter your nickname:");
    if (!nickname) nickname = email;

    await setDoc(doc(db, "users", email), {
      email,
      nickname
    }, { merge: true });

  } catch (err) {
    alert(err.message);
  }
};

// PROFILE
function setupProfile() {
  const avatar = document.getElementById("avatar");
  const menu = document.getElementById("menu");
  const fileInput = document.getElementById("avatarInput");

  avatar.innerText = currentUser.charAt(0).toUpperCase();

  avatar.onclick = () => menu.classList.toggle("hidden");

  fileInput.onchange = async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const url = await uploadToCloudinary(file);

    await updateDoc(doc(db, "users", currentUser), {
      avatar: url
    });

    avatar.innerHTML = `<img src="${url}" class="w-full h-full rounded-full object-cover">`;
  };
}

// LOGOUT (FIXED)
window.logout = async function () {
  await signOut(auth);
  location.reload();
};

// USERS
async function loadUsers() {
  const snap = await getDocs(collection(db, "users"));
  const container = document.getElementById("usersList");

  container.innerHTML = "";

  snap.forEach(docSnap => {
    const user = docSnap.data();

    if (user.email === currentUser) return;

    const div = document.createElement("div");
    div.className = "flex items-center gap-3 p-3 border-b border-white/10 cursor-pointer";

    div.innerHTML = `
      <img src="${user.avatar || 'https://via.placeholder.com/40'}"
           class="w-10 h-10 rounded-full object-cover">
      <span>${user.nickname}</span>
    `;

    div.onclick = () => openChat(user.email);

    container.appendChild(div);
  });
}

// OPEN CHAT
window.openChat = function (otherUser) {
  currentChat = [currentUser, otherUser].sort().join("_");

  document.getElementById("chatList").classList.add("hidden");
  document.getElementById("chatScreen").classList.remove("hidden");

  document.getElementById("chatHeader").innerText = otherUser;

  loadMessages();
};

// BACK
window.goBack = function () {
  document.getElementById("chatScreen").classList.add("hidden");
  document.getElementById("chatList").classList.remove("hidden");
};

// MESSAGES
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

// SEND
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
