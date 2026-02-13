let chats = JSON.parse(localStorage.getItem("chats")) || {};
let chatMeta = JSON.parse(localStorage.getItem("chatMeta")) || {};
let currentChat = null;

const chatBox = document.getElementById("chatBox");
const newChatModal = document.getElementById("newChatModal");
const characterNameInput = document.getElementById("characterNameInput");
const characterAvatarInput = document.getElementById("characterAvatarInput");
const characterAvatarFileInput = document.getElementById("characterAvatarFile");
const characterAvatarPreview = document.getElementById("characterAvatarPreview");
const characterAvatarPreviewImg = document.getElementById("characterAvatarPreviewImg");

function newChat() {
  openNewChatModal();
}

function openAvatarPicker() {
  if (characterAvatarFileInput) {
    characterAvatarFileInput.click();
  }
}

function createChat(nameValue = "", avatarValue = "", avatarType = "text") {
  const id = "chat_" + Date.now();
  const trimmedName = (nameValue || "").trim();
  const trimmedAvatar = (avatarValue || "").trim();

  const name = trimmedName || `Character ${Object.keys(chats).length + 1}`;
  const avatar = avatarType === "image" ? avatarValue : (trimmedAvatar || "AI");

  chats[id] = [];
  chatMeta[id] = { name, avatar, avatarType };

  currentChat = id;
  saveChats();
  renderChatList();
  renderMessages();
}

function openNewChatModal() {
  if (!newChatModal) return;

  if (characterNameInput) {
    characterNameInput.value = "";
  }
  if (characterAvatarInput) {
    characterAvatarInput.value = "";
  }
  if (characterAvatarFileInput) {
    characterAvatarFileInput.value = "";
  }
  if (characterAvatarPreview) {
    characterAvatarPreview.classList.add("hidden");
  }
  if (characterAvatarPreviewImg) {
    characterAvatarPreviewImg.removeAttribute("src");
  }

  newChatModal.classList.remove("hidden");
  if (characterNameInput) {
    characterNameInput.focus();
  }
}

function closeNewChatModal() {
  if (!newChatModal) return;
  newChatModal.classList.add("hidden");
}

async function submitNewChatModal() {
  const name = characterNameInput ? characterNameInput.value : "";
  const avatarText = characterAvatarInput ? characterAvatarInput.value : "";
  const avatarFile =
    characterAvatarFileInput && characterAvatarFileInput.files
      ? characterAvatarFileInput.files[0]
      : null;

  let avatarValue = avatarText;
  let avatarType = "text";

  if (avatarFile) {
    try {
      avatarValue = await readImageAsDataUrl(avatarFile, 72);
      avatarType = "image";
    } catch (error) {
      alert("Could not load selected avatar image. Using text avatar instead.");
    }
  }

  createChat(name, avatarValue, avatarType);
  closeNewChatModal();
}

function renderChatList() {
  const list = document.getElementById("chatList");
  list.innerHTML = "";

  Object.keys(chats).forEach(id => {
    const meta = chatMeta[id] || {};
    const name = meta.name || id;
    const item = document.createElement("div");
    item.classList.add("chat-item");

    const avatarNode = createAvatarNode(meta);

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

    item.appendChild(avatarNode);
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
  if (!text) return;
  if (!currentChat) {
    openNewChatModal();
    return;
  }

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

  await appendMessage(data.reply, "bot", true, true);
  chats[currentChat].push({ role: "bot", text: data.reply });
  saveChats();
}

function createAvatarNode(meta) {
  const avatar = meta.avatar || "AI";
  const avatarType =
    meta.avatarType ||
    (typeof avatar === "string" && avatar.startsWith("data:image/") ? "image" : "text");

  const avatarNode = document.createElement("span");
  avatarNode.classList.add("chat-avatar");

  if (avatarType === "image" && typeof avatar === "string" && avatar.startsWith("data:image/")) {
    const img = document.createElement("img");
    img.classList.add("chat-avatar-image");
    img.src = avatar;
    img.alt = "Character avatar";
    avatarNode.appendChild(img);
    return avatarNode;
  }

  avatarNode.innerText = String(avatar).slice(0, 2);
  return avatarNode;
}

async function readImageAsDataUrl(file, sizePx = 72) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = sizePx;
  canvas.height = sizePx;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return dataUrl;
  }

  const scale = Math.max(sizePx / image.width, sizePx / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const offsetX = (sizePx - drawWidth) / 2;
  const offsetY = (sizePx - drawHeight) / 2;

  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  return canvas.toDataURL("image/jpeg", 0.82);
}

async function appendMessage(text, role, save = true, animate = false) {
  const div = document.createElement("div");
  div.classList.add("message", role);

  if (role === "bot" && animate) {
    await typeBotMessage(div, text);
  } else if (role === "bot") {
    div.innerHTML = marked.parse(text);
  } else {
    div.innerText = text;
  }

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function typeBotMessage(div, text) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    div.innerHTML = marked.parse(text);
    return;
  }

  div.classList.add("typing");
  div.textContent = "";

  const baseDelay = 14;

  for (let i = 0; i < text.length; i += 1) {
    div.textContent += text[i];
    chatBox.scrollTop = chatBox.scrollHeight;

    const char = text[i];
    const pause =
      char === "." || char === "!" || char === "?" ? 95 :
      char === "," ? 45 :
      char === "\n" ? 55 :
      baseDelay;

    await new Promise((resolve) => setTimeout(resolve, pause));
  }

  div.classList.remove("typing");
  div.innerHTML = marked.parse(text);
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
      createChat();
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

if (newChatModal) {
  newChatModal.addEventListener("click", (event) => {
    if (event.target === newChatModal) {
      closeNewChatModal();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (!newChatModal || newChatModal.classList.contains("hidden")) return;

  if (event.key === "Escape") {
    closeNewChatModal();
  }

  if (event.key === "Enter") {
    submitNewChatModal();
  }
});

if (characterAvatarFileInput) {
  characterAvatarFileInput.addEventListener("change", async () => {
    const file =
      characterAvatarFileInput.files && characterAvatarFileInput.files.length
        ? characterAvatarFileInput.files[0]
        : null;

    if (!file || !characterAvatarPreview || !characterAvatarPreviewImg) {
      if (characterAvatarPreview) {
        characterAvatarPreview.classList.add("hidden");
      }
      return;
    }

    try {
      const previewDataUrl = await readImageAsDataUrl(file, 72);
      characterAvatarPreviewImg.src = previewDataUrl;
      characterAvatarPreview.classList.remove("hidden");
    } catch (error) {
      characterAvatarPreview.classList.add("hidden");
      alert("Could not preview selected image.");
    }
  });
}

/* Init */
renderChatList();



