let chats = JSON.parse(localStorage.getItem("chats")) || {};
let chatMeta = JSON.parse(localStorage.getItem("chatMeta")) || {};
let currentChat = null;

const chatBox = document.getElementById("chatBox");

function newChat() {
  const id = "chat_" + Date.now();

  const name =
    prompt("Character name:", "New Character") || `Character ${Object.keys(chats).length + 1}`;
  const avatar = prompt("Avatar (emoji or short text):", "🤖") || "🤖";

  chats[id] = [];
  chatMeta[id] = { name, avatar };

  currentChat = id;
  saveChats();
  renderChatList();
  renderMessages();
}

function renderChatList() {
  const list = document.getElementById("chatList");
  list.innerHTML = "";

  Object.keys(chats).forEach(id => {
    const meta = chatMeta[id] || {};
    const name = meta.name || id;
    const avatar = meta.avatar || "🤖";

    const item = document.createElement("div");
    item.classList.add("chat-item");

    const avatarSpan = document.createElement("span");
    avatarSpan.classList.add("chat-avatar");
    avatarSpan.innerText = avatar;

    const title = document.createElement("span");
    title.classList.add("chat-title");
    title.innerText = name;
    title.onclick = () => {
      currentChat = id;
      renderMessages();
    };

    const delBtn = document.createElement("button");
    delBtn.classList.add("chat-delete");
    delBtn.innerText = "×";
    delBtn.onclick = (e) => {
      e.stopPropagation();
      deleteChat(id);
    };

    item.appendChild(avatarSpan);
    item.appendChild(title);
    item.appendChild(delBtn);
    list.appendChild(item);
  });
}

function deleteChat(id) {
  if (!chats[id]) return;
  delete chats[id];
  delete chatMeta[id];

  if (currentChat === id) {
    const remainingIds = Object.keys(chats);
    currentChat = remainingIds.length ? remainingIds[0] : null;
  }

  saveChats();
  renderChatList();
  renderMessages();
}

function renderMessages() {
  chatBox.innerHTML = "";
  if (!currentChat) return;

  const headerName = document.getElementById("chatHeaderName");
  const meta = chatMeta[currentChat] || {};
  if (headerName) {
    headerName.innerText = meta.name || "Anish AI";
  }

  chats[currentChat].forEach(msg => {
    appendMessage(msg.text, msg.role, false);
  });
}

function saveChats() {
  localStorage.setItem("chats", JSON.stringify(chats));
  localStorage.setItem("chatMeta", JSON.stringify(chatMeta));
}

async function sendMessage() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text || !currentChat) return;

  appendMessage(text, "user");
  chats[currentChat].push({ role: "user", text });
  input.value = "";
  saveChats();

  // show dynamic thinking response
  const thinkingDiv = document.createElement("div");
  thinkingDiv.classList.add("message", "bot", "thinking");
  thinkingDiv.innerText = "Thinking…";
  chatBox.appendChild(thinkingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  const response = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text })
  });

  const data = await response.json();

  // remove thinking bubble
  if (thinkingDiv && thinkingDiv.parentNode) {
    thinkingDiv.parentNode.removeChild(thinkingDiv);
  }

  appendMessage(data.reply, "bot");
  chats[currentChat].push({ role: "bot", text: data.reply });
  saveChats();
}

function appendMessage(text, role, save = true) {
  const div = document.createElement("div");
  div.classList.add("message", role);

  if (role === "bot") {
    div.innerHTML = marked.parse(text);
  } else {
    div.innerText = text;
  }

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

/* Voice Input */
function startVoice() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Voice input is not supported in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    const input = document.getElementById("userInput");
    if (input) {
      input.value = transcript;
    }

    // ensure there is an active chat
    if (!currentChat) {
      newChat();
    }

    sendMessage();
  };

  recognition.onerror = function () {
    alert("There was a problem with voice input. Please try again.");
  };

  recognition.start();
}

/* Theme */
const toggle = document.getElementById("themeToggle");

if (toggle) {
  toggle.addEventListener("change", () => {
    document.body.classList.toggle("light");
    localStorage.setItem(
      "theme",
      document.body.classList.contains("light") ? "light" : "dark"
    );
  });
}

// Load saved theme
if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light");
  toggle.checked = true;
}

const input = document.getElementById("userInput");
if (input) {
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
}

/* Init */
renderChatList();
