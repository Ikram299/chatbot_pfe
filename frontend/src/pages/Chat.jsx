import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Chat.css";
import QuizPanel from "../components/QuizPanel";

function Chat() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    { role: "bot", text: "Bienvenue sur EduAI Assistant 🎓 Posez une question." }
  ]);
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [quizType, setQuizType] = useState("qcm");
  const [quizLevel, setQuizLevel] = useState("moyen");
  const [quizQuestions, setQuizQuestions] = useState(null);
  const [currentDocumentId, setCurrentDocumentId] = useState(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const getUserId = () => {
    const userId = localStorage.getItem("user_id");
    return userId ? Number(userId) : null;
  };

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

  const loadMessages = async (conversation_id) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/chat/messages/${conversation_id}`);
      const data = await res.json();
      const messagesArray = Array.isArray(data) ? data : data.messages || [];
      const formatted = messagesArray.map((msg) => ({
        role: msg.role === "assistant" ? "bot" : msg.role,
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

  useEffect(() => {
    loadConversations();
  }, []);

  // ========= SEND MESSAGE =========
  const sendMessage = async () => {
    if (!input.trim()) return;
    const userText = input;
    const userId = getUserId();
    if (!userId) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setIsTyping(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
  user_id: userId,
  message: userText,
  conversation_id: currentConversation,
  document_id: currentDocumentId,
}),
      });
      const data = await res.json();
      if (!currentConversation) {
        setCurrentConversation(data.conversation_id);
        await loadConversations();
      }
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.response || "⚠️ réponse vide", isNew: true },
      ]);
    } catch (err) {
      console.error("sendMessage error:", err);
      setIsTyping(false);
      setMessages((prev) => [...prev, { role: "bot", text: "⚠️ erreur serveur" }]);
    }
  };

const uploadPDF = async () => {
    if (!selectedFile) return;
    const userId = getUserId();
    if (!userId) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("user_id", userId);
    try {
      const res = await fetch("http://127.0.0.1:8000/documents/upload-pdf", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setCurrentDocumentId(data.document_id);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: `📄 PDF "${data.file_name}" uploadé ! Posez vos questions.` },
      ]);
    } catch (err) {
      console.error("uploadPDF error:", err);
    }
};
  // ========= AGENT RÉSUMÉ =========
  const getSummary = async () => {
    const userId = getUserId();
    if (!userId) return;
    setIsTyping(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/chat/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "📝 Résumé du cours :\n\n" + data.summary, isNew: true },
      ]);
    } catch (err) {
      setIsTyping(false);
      console.error(err);
    }
  };
const getQuiz = async () => {
  const userId = getUserId();
  if (!userId) return;
  setIsTyping(true);
  try {
    const res = await fetch("http://127.0.0.1:8000/chat/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, type: quizType, level: quizLevel }),
    });
    const data = await res.json();
    setIsTyping(false);
    if (data.quiz && data.quiz.length > 0) {
      setQuizQuestions(data.quiz);
    } else {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "⚠️ Impossible de générer le quiz. Uploadez d'abord un PDF." }
      ]);
    }
  } catch (err) {
    setIsTyping(false);
    console.error(err);
  }
};
  // ========= LOGOUT =========
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    navigate("/");
  };

  return (
    <div className="notebook-container">
      {quizQuestions && (
  <QuizPanel
    questions={quizQuestions}
    onClose={() => setQuizQuestions(null)}
  />
)}
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
          <button className="btn-action logout" onClick={handleLogout}>
            🚪 Déconnexion
          </button>
        </div>
      </header>

      <div className="notebook-workspace">

        {/* PANNEAU GAUCHE — Conversations */}
        <aside className="panel panel-sources">
          <div className="panel-header">
            <h3>Conversations</h3>
          </div>
          <div className="panel-content">
            <button
              className="btn-add-source"
              onClick={() => {
                setMessages([{ role: "bot", text: "Nouvelle conversation 🎓" }]);
                setCurrentConversation(null);
              }}
            >
              ✕ Nouvelle conversation
            </button>
            <div className="sources-list">
              {(Array.isArray(conversations) ? conversations : []).map((conv) => (
                <div
                  key={conv.id}
                  className={`source-item ${currentConversation === conv.id ? "active" : ""}`}
                  onClick={() => loadMessages(conv.id)}
                >
                  💬 {conv.title || "Conversation"}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* PANNEAU CENTRE — Chat */}
        <main className="panel panel-discussion">
          <div className="chat-area">
            <div className="messages-container">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message-row ${msg.role === "user" ? "user-row" : "bot-row"}`}
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
              <div ref={messagesEndRef} />
            </div>
          </div>

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
                placeholder="Posez une question sur votre cours..."
                className="chat-input-field"
              />
              <button
                type="button"
                className={`chat-send-btn ${input.trim() ? "active" : ""}`}
                onClick={sendMessage}
              >
                ➤
              </button>
            </div>
            <div className="disclaimer-text">EduAI peut se tromper.</div>
          </div>
        </main>

        {/* PANNEAU DROIT — Studio */}
        <aside className="panel panel-studio">
          <div className="panel-header">
            <h3>Studio académique</h3>
          </div>
          <div className="panel-content">

            {/* Upload PDF */}
            <p style={{fontSize:"12px", color:"#666", marginBottom:"4px"}}>
              📂 Choisir un PDF :
            </p>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              style={{marginBottom:"8px", fontSize:"12px"}}
            />
            <button className="studio-card" onClick={uploadPDF}>
              📜 Upload PDF
            </button>

            <hr style={{margin:"16px 0", border:"1px solid #eee"}}/>

            {/* Agent Résumé */}
            <button className="studio-card" onClick={getSummary}>
              📝 Résumer le cours
            </button>

            <hr style={{margin:"16px 0", border:"1px solid #eee"}}/>

            {/* Agent Quiz */}
            <p style={{fontSize:"12px", color:"#666", marginBottom:"4px"}}>
              Type de quiz :
            </p>
            <select
              value={quizType}
              onChange={(e) => setQuizType(e.target.value)}
              style={{width:"100%", padding:"6px", marginBottom:"8px", borderRadius:"6px"}}
            >
              <option value="qcm">QCM</option>
              <option value="vrai_faux">Vrai / Faux</option>
            </select>

            <p style={{fontSize:"12px", color:"#666", marginBottom:"4px"}}>
              Niveau :
            </p>
            <select
              value={quizLevel}
              onChange={(e) => setQuizLevel(e.target.value)}
              style={{width:"100%", padding:"6px", marginBottom:"8px", borderRadius:"6px"}}
            >
              <option value="facile">Facile</option>
              <option value="moyen">Moyen</option>
              <option value="difficile">Difficile</option>
            </select>

            <button className="studio-card" onClick={getQuiz}>
              ❓ Générer Quiz
            </button>

          </div>
        </aside>

      </div>
    </div>
  );
}

export default Chat;