// ==========================
// USER SETUP (Nickname)
// ==========================
let nickname = localStorage.getItem("nickname");

if (!nickname) {
  nickname = prompt("Enter your nickname:");

  if (!nickname || nickname.trim() === "") {
    nickname = "User" + Math.floor(Math.random() * 1000);
  }

  localStorage.setItem("nickname", nickname);
}

// ==========================
// UI ELEMENTS
// ==========================
const userIcon = document.getElementById("userIcon");
const dropdown = document.getElementById("userDropdown");
const userNameDisplay = document.getElementById("userNameDisplay");
const logoutBtn = document.getElementById("logoutBtn");

const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const chatContainer = document.getElementById("chatContainer");

// ==========================
// SET USER UI
// ==========================
userNameDisplay.innerText = nickname;
userIcon.innerText = nickname.charAt(0).toUpperCase();

// ==========================
// DROPDOWN LOGIC
// ==========================
userIcon.addEventListener("click", () => {
  dropdown.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  if (!document.getElementById("userSection").contains(e.target)) {
    dropdown.classList.add("hidden");
  }
});

// ==========================
// LOGOUT
// ==========================
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("nickname");
  alert("Logged out!");
  location.reload();
});

// ==========================
// MESSAGE SYSTEM
// ==========================

// Temporary in-memory storage (replace with backend later)
let messages = JSON.parse(localStorage.getItem("messages")) || [];

// Render messages
function renderMessages() {
  chatContainer.innerHTML = "";

  messages.forEach((msg) => {
    const msgDiv = document.createElement("div");

    msgDiv.classList.add("message");

    // DIFFERENTIATE SENDER
    if (msg.sender === nickname) {
      msgDiv.classList.add("sent");
    } else {
      msgDiv.classList.add("received");
    }

    msgDiv.innerHTML = `
      <div class="msgText">${msg.text}</div>
      <div class="msgMeta">
        <span>${msg.sender}</span>
        <span>${msg.seen ? "✓✓ Seen" : "✓ Sent"}</span>
      </div>
    `;

    chatContainer.appendChild(msgDiv);
  });

  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ==========================
// SEND MESSAGE
// ==========================
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = messageInput.value.trim();

  if (text === "") return;

  const newMsg = {
    sender: nickname,
    text: text,
    seen: false,
    time: Date.now()
  };

  messages.push(newMsg);
  localStorage.setItem("messages", JSON.stringify(messages));

  messageInput.value = "";

  renderMessages();

  simulateReceive(); // simulate other user
}

// ==========================
// SIMULATE OTHER USER (Demo)
// ==========================
function simulateReceive() {
  setTimeout(() => {
    const reply = {
      sender: "OtherUser",
      text: "Reply to: " + messages[messages.length - 1].text,
      seen: true,
      time: Date.now()
    };

    messages.push(reply);

    // mark last sent message as seen
    messages.forEach((msg) => {
      if (msg.sender === nickname) {
        msg.seen = true;
      }
    });

    localStorage.setItem("messages", JSON.stringify(messages));

    renderMessages();
  }, 1000);
}

// ==========================
// TYPING INDICATOR (BASIC)
// ==========================
let typingTimeout;

messageInput.addEventListener("input", () => {
  console.log("typing...");

  clearTimeout(typingTimeout);

  typingTimeout = setTimeout(() => {
    console.log("stopped typing");
  }, 1000);
});

// ==========================
// INITIAL LOAD
// ==========================
renderMessages();
