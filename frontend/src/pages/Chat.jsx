import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Chat.css";

function Chat() {
  const navigate = useNavigate();
  
  // Référence pour l'auto-scroll
  const messagesEndRef = useRef(null);

  // =========================
  // STATE
  // =========================
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Bienvenue sur EduAI Assistant 🎓 Posez une question.",
    },
  ]);

  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isTyping, setIsTyping] = useState(false); // État pour l'animation de réflexion
  const [selectedFile, setSelectedFile] = useState(null);

  // =========================
  // AUTO-SCROLL
  // =========================
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]); // Scrolle dès que les messages changent ou que le bot tape

  // =========================
  // USER ID
  // =========================
  const getUserId = () => {
    const userId = localStorage.getItem("user_id");
    return userId ? Number(userId) : null;
  };

  // =========================
  // LOAD HISTORY
  // =========================
  const loadHistory = async () => {
    const user_id = getUserId();
    if (!user_id) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/chat/conversations/${user_id}`);
      const data = await res.json();

      const messagesArray = Array.isArray(data) ? data : data.messages || [];

      const formatted = messagesArray.map((msg) => ({
        role: msg.role,
        text: msg.content,
      }));

      setMessages([
        {
          role: "bot",
          text: "Bienvenue sur EduAI Assistant 🎓 Posez une question.",
        },
        ...formatted,
      ]);
    } catch (error) {
      console.error("loadHistory error:", error);
    }
  };

  // =========================
  // LOAD CONVERSATIONS
  // =========================
  const loadConversations = async () => {
    const user_id = getUserId();
    if (!user_id) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/chat/conversations/${user_id}`);
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("loadConversations error:", err);
    }
  };

  // =========================
  // LOAD MESSAGES (ONE CONVERSATION)
  // =========================
  const loadMessages = async (conversation_id) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/messages/${conversation_id}`);
      const data = await res.json();

      const messagesArray = Array.isArray(data) ? data : data.messages || [];

      const formatted = messagesArray.map((msg) => ({
        role: msg.role,
        text: msg.content,
      }));

      setMessages([
        { role: "bot", text: "Conversation chargée 🎓" },
        ...formatted,
      ]);

      setCurrentConversation(conversation_id);
    } catch (err) {
      console.error("loadMessages error:", err);
    }
  };

  // =========================
  // INIT
  // =========================
  useEffect(() => {
    loadHistory();
    loadConversations();
  }, []);

  // =========================
  // SEND MESSAGE
  // =========================
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;
    const userId = getUserId();

    if (!userId) return;

    setInput("");

    // Ajouter le message de l'utilisateur et activer le mode "isTyping" (style ChatGPT)
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setIsTyping(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          message: userText,
          conversation_id: currentConversation,
        }),
      });

      const data = await res.json();

      if (!currentConversation) {
        setCurrentConversation(data.conversation_id);
        await loadConversations();
      }

      // Désactiver le chargement et ajouter la réponse avec une classe d'animation d'apparition
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: data.response || "❌ réponse vide",
          isNew: true, // Tag pour déclencher l'effet fade-in/typing en CSS
        },
      ]);
    } catch (err) {
      console.error("sendMessage error:", err);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "❌ erreur serveur" },
      ]);
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    navigate("/");
  };

  const uploadPDF = async () => {
  if (!selectedFile) return;

  const userId = getUserId();
  if (!userId) return;

  const formData = new FormData();
  formData.append("file", selectedFile);
  formData.append("user_id", userId);

  try {
    const res = await fetch("http://127.0.0.1:8000/upload-pdf", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setMessages((prev) => [
      ...prev,
      {
        role: "bot",
        text: "📄 PDF uploadé avec succès !",
      },
    ]);

    console.log("PDF response:", data);
  } catch (err) {
    console.error("uploadPDF error:", err);
  }
};
  // =========================
  // UI
  // =========================
  return (
    <div className="notebook-container">
      <header className="notebook-header">
        <div className="header-left">
          <div className="app-logo">🎓</div>
          <div className="notebook-title-wrapper">
            <h1 className="notebook-title">EduAI Assistant</h1>
            <span className="notebook-status">
              Système multi-agents d'apprentissage intelligent
            </span>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn-action secondary">📊 Analyse</button>
          <button className="btn-action logout" onClick={handleLogout}>
            🚪
          </button>
        </div>
      </header>

      <div className="notebook-workspace">
        {/* LEFT PANEL */}
        <aside className="panel panel-sources">
          <div className="panel-header">
            <h3>Conversations</h3>
          </div>

          <div className="panel-content">
            <button
              className="btn-add-source"
              onClick={() => {
                setMessages([
                  {
                    role: "bot",
                    text: "Nouvelle conversation 🎓",
                  },
                ]);
                setCurrentConversation(null);
              }}
            >
              ➕ Nouvelle conversation
            </button>

            <div className="sources-list">
              {(Array.isArray(conversations) ? conversations : []).map((conv) => (
                <div
                  key={conv.id}
                  className={`source-item ${
                    currentConversation === conv.id ? "active" : ""
                  }`}
                  onClick={() => loadMessages(conv.id)}
                >
                  📚 {conv.title || "Conversation"}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER PANEL (CHAT) */}
        <main className="panel panel-discussion">
          <div className="chat-area">
            <div className="messages-container">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message-row ${
                    msg.role === "user" ? "user-row" : "bot-row"
                  }`}
                >
                  <div className={`message-avatar ${msg.role}`}>
                    {msg.role === "user" ? "👤" : "🤖"}
                  </div>

                  <div className="message-bubble-content">
                    <p className={`message-text ${msg.isNew ? "typing-effect" : ""}`}>
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}

              {/* Animation des 3 points de ChatGPT quand le bot réfléchit */}
              {isTyping && (
                <div className="message-row bot-row">
                  <div className="message-avatar bot">🤖</div>
                  <div className="message-bubble-content">
                    <div className="chatgpt-typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Élément invisible pour forcer le scroll en bas */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* INPUT BAR */}
          <div className="chat-input-wrapper">
            <div className="chat-input-container">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Posez une question..."
                className="chat-input-field"
              />
              <button
                type="button"
                className={`chat-send-btn ${input.trim() ? "active" : ""}`}
                onClick={sendMessage}
              >
                ▲
              </button>
            </div>
            <div className="disclaimer-text">EduAI peut se tromper.</div>
          </div>
        </main>

        {/* RIGHT PANEL */}
        <aside className="panel panel-studio">
          <div className="panel-header">
            <h3>Studio académique</h3>
          </div>
          <div className="panel-content">
            <input type="file" accept=".pdf" onChange={(e) => setSelectedFile(e.target.files[0])}/>
            <button className="studio-card" onClick={uploadPDF}>
                    📁 Upload PDF
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Chat;