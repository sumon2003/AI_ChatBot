// const chatBox = document.getElementById('chat-box');
// const userInput = document.getElementById('user-input');
// const sendBtn = document.getElementById('send-btn');

// // 🧠 Typing animation (three dots)
// function showTypingAnimation() {
//   const typingDiv = document.createElement('div');
//   typingDiv.classList.add('bot-message', 'typing');
//   typingDiv.innerHTML = `
//     <div class="dot"></div>
//     <div class="dot"></div>
//     <div class="dot"></div>
//   `;
//   chatBox.appendChild(typingDiv);
//   chatBox.scrollTop = chatBox.scrollHeight;
//   return typingDiv;
// }

// async function sendMessage() {
//   const message = userInput.value.trim();
//   if (!message) return;

//   // 🧍 User message
//   const userMsg = document.createElement('div');
//   userMsg.classList.add('user-message');
//   userMsg.textContent = message;
//   chatBox.appendChild(userMsg);

//   userInput.value = "";
//   chatBox.scrollTop = chatBox.scrollHeight;

//   // 🤖 Bot typing animation
//   const typingDiv = showTypingAnimation();

//   try {
//     // 1️⃣ Send message to Flask server
//     const response = await fetch('/ask', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ message })
//     });
//     const data = await response.json();
//     let botReply = data.reply || "Sorry, I couldn't understand that.";

//     // 2️⃣ Replace formatting (**bold**) and line breaks
//     botReply = botReply.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
//     botReply = botReply.replace(/\n/g, "<br>");

//     // 3️⃣ Detect emotion (emoji)
//     const emotionResponse = await fetch('/detect_emotion', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ text: botReply })
//     });
//     const emotionData = await emotionResponse.json();
//     const emoji = emotionData.emoji || "💬";

//     // 4️⃣ Replace typing with bot reply
//     typingDiv.remove();

//     const botMsg = document.createElement('div');
//     botMsg.classList.add('bot-message');
//     botMsg.innerHTML = `${botReply} ${emoji}`;
//     chatBox.appendChild(botMsg);
//     chatBox.scrollTop = chatBox.scrollHeight;

//   } catch (error) {
//     typingDiv.remove();
//     const botMsg = document.createElement('div');
//     botMsg.classList.add('bot-message');
//     botMsg.textContent = "⚠️ Error getting response!";
//     chatBox.appendChild(botMsg);
//     console.error(error);
//   }
// }

// sendBtn.addEventListener("click", sendMessage);
// userInput.addEventListener("keypress", (e) => {
//   if (e.key === "Enter") sendMessage();
// });


// =========================================================

const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const fileUpload = document.getElementById('file-upload');
const uploadBtn = document.getElementById('upload-btn');
const uploadStatus = document.getElementById('upload-status');

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // Show user message
  const userMsg = document.createElement('div');
  userMsg.classList.add('user-message');
  userMsg.textContent = message;
  chatBox.appendChild(userMsg);

  userInput.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  // Create bot message container with "typing..." animation
  const botMsg = document.createElement('div');
  botMsg.classList.add('bot-message');
  botMsg.innerHTML = `<span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>`;
  chatBox.appendChild(botMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    // Fetch AI reply
    const response = await fetch('/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    let botReply = data.reply || "Sorry, I couldn't understand that.";

    // Convert Markdown-style **bold** and newlines
    botReply = botReply.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    botReply = botReply.replace(/\n/g, "<br>");

    // Remove typing dots before starting typing animation
    botMsg.innerHTML = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    // Split the reply into chunks (text + HTML tags)
    const parts = botReply.split(/(<.*?>)/g); // split by HTML tags
    let i = 0;

    async function typePart() {
      if (i < parts.length) {
        if (parts[i].startsWith("<")) {
          // Append full HTML tag instantly
          botMsg.innerHTML += parts[i];
        } else {
          // Type text character-by-character
          for (let j = 0; j < parts[i].length; j++) {
            botMsg.innerHTML += parts[i][j];
            chatBox.scrollTop = chatBox.scrollHeight;
            await new Promise((r) => setTimeout(r, 50)); // typing speed
          }
        }
        i++;
        setTimeout(typePart, 10);
      }
    }

    typePart();

  } catch (error) {
    botMsg.textContent = "Error getting response! ⚠️";
    console.error(error);
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}



document.getElementById("upload-btn").addEventListener("click", async () => {
  const fileInput = document.getElementById("file-upload");
  const status = document.getElementById("upload-status");
  const preview = document.getElementById("uploaded-files");

  if (!fileInput.files.length) {
    status.textContent = "⚠️ Please select a file first!";
    return;
  }

  const file = fileInput.files[0];
  status.textContent = "⏳ Uploading...";

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/upload_file", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();

    if (result.success) {
      status.textContent = "✅ File uploaded successfully!";
      
      // Add file preview to right side
      const fileDiv = document.createElement("div");
      fileDiv.classList.add("uploaded-file");

      const icon = file.name.endsWith(".pdf") ? "fa-file-pdf" : "fa-file-word";
      fileDiv.innerHTML = `<i class="fas ${icon}"></i> <span>${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>`;
      
      preview.innerHTML = ""; // clear previous
      preview.appendChild(fileDiv);
    } else {
      status.textContent = "❌ Upload failed!";
    }
  } catch (error) {
    status.textContent = "⚠️ Error uploading file.";
    console.error(error);
  }
});



sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});
