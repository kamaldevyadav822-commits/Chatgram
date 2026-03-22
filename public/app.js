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

  await signInWithEmailAndPassword(auth, email, password);

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

    setupProfile();
    loadUsers();
  }
});

// PROFILE
function setupProfile() {
  const avatar = document.getElementById("avatar");
  const menu = document.getElementById("menu");

  avatar.innerText = currentUser.charAt(0).toUpperCase();

  avatar.onclick = (e) => {
    e.stopPropagation();
    menu.classList.toggle("hidden");
  };

  document.addEventListener("click", () => {
    menu.classList.add("hidden");
  });
}

// LOGOUT
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
    usersCache[user.email] = user;

    if (user.email === currentUser) return;

    const div = document.createElement("div");
    div.className = "p-3 border-b cursor-pointer";
    div.innerText = user.nickname;

    div.onclick = () => openChat(user.email);

    container.appendChild(div);
  });
}

// OPEN CHAT
window.openChat = function (otherUser) {
  currentChat = [currentUser, otherUser].sort().join("_");

  document.getElementById("chatList").classList.add("hidden");
  document.getElementById("chatScreen").classList.remove("hidden");

  document.getElementById("chatHeader").innerText =
    usersCache[otherUser]?.nickname;

  listenTyping(otherUser);
  loadMessages();
};

// BACK
window.goBack = function () {
  document.getElementById("chatScreen").classList.add("hidden");
  document.getElementById("chatList").classList.remove("hidden");
};

// 🔥 TYPING SYSTEM
const msgInput = document.getElementById("msg");

msgInput.addEventListener("input", async () => {
  if (!currentChat) return;

  await setDoc(doc(db, "typing", currentChat), {
    [currentUser]: true
  }, { merge: true });

  setTimeout(async () => {
    await setDoc(doc(db, "typing", currentChat), {
      [currentUser]: false
    }, { merge: true });
  }, 1000);
});

function listenTyping(otherUser) {
  onSnapshot(doc(db, "typing", currentChat), (docSnap) => {
    const data = docSnap.data();

    if (data && data[otherUser]) {
      document.getElementById("chatHeader").innerText =
        usersCache[otherUser]?.nickname + " (typing...)";
    } else {
      document.getElementById("chatHeader").innerText =
        usersCache[otherUser]?.nickname;
    }
  });
}

// 🔥 LOAD MESSAGES WITH TIMESTAMP BELOW SEEN
function loadMessages() {
  const q = query(collection(db, "messages"), where("chatId", "==", currentChat));

  onSnapshot(q, async (snap) => {
    const box = document.getElementById("messages");
    box.innerHTML = "";

    let messages = [];

    snap.forEach(docSnap => {
      messages.push({ id: docSnap.id, ...docSnap.data() });
    });

    messages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    for (const m of messages) {
      const isMe = m.sender === currentUser;

      const time = m.createdAt
        ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : "";

      const div = document.createElement("div");
      div.className = `flex flex-col ${isMe ? "items-end" : "items-start"}`;

      div.innerHTML = `
        <div class="px-3 py-2 rounded-xl max-w-[70%]
          ${isMe ? "bg-blue-500 text-white" : "bg-white/20 text-white"}">

          ${m.text || ""}
        </div>

        ${isMe ? `
          <span class="text-[10px] text-gray-400 mt-1">
            ${m.seen ? "👁 Seen" : "✓ Sent"}
          </span>
        ` : ""}

        <span class="text-[9px] text-gray-500">
          ${time}
        </span>
      `;

      box.appendChild(div);

      if (!isMe && !m.seen) {
        await updateDoc(doc(db, "messages", m.id), {
          seen: true
        });
      }
    }

    box.scrollTop = box.scrollHeight;
  });
}

// SEND
window.sendMessage = async function () {
  const text = document.getElementById("msg").value.trim();
  if (!text) return;

  await addDoc(collection(db, "messages"), {
    text,
    sender: currentUser,
    chatId: currentChat,
    createdAt: Date.now(),
    seen: false
  });

  document.getElementById("msg").value = "";
};
