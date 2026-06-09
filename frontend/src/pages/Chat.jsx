import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Chat.css";
import QuizPanel from "../components/QuizPanel";
import SummaryPanel from "../components/SummaryPanel";
function Chat() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [messages, setMessages] = useState([
    { role: "bot", text: "Bienvenue sur EduAI Assistant 🎓 Uploadez un PDF et posez vos questions !" }
  ]);
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [quizType, setQuizType] = useState("qcm");
  const [quizLevel, setQuizLevel] = useState("moyen");
  const [quizQuestions, setQuizQuestions] = useState(null);
  const [currentDocumentId, setCurrentDocumentId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "Utilisateur", email: "" });
  const [summaryText, setSummaryText] = useState(null);
  const [summaries, setSummaries] = useState([]);
const [selectedSummary, setSelectedSummary] = useState(null);
const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
const [sidebarVisible, setSidebarVisible] = useState(true);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  const getUserId = () => {
    const userId = localStorage.getItem("user_id");
    return userId ? Number(userId) : null;
  };

  useEffect(() => {
    loadConversations();
    const name = localStorage.getItem("user_name") || "Utilisateur";
    const email = localStorage.getItem("user_email") || "";
    setUserInfo({ name, email });
  }, []);

  const getInitials = (name) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const loadConversations = async () => {
    const user_id = getUserId();
    if (!user_id) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/chat/conversations/${user_id}`);
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async (conversation_id) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/chat/messages/${conversation_id}`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.messages || [];
      setMessages([
        { role: "bot", text: "Conversation chargée 🎓" },
        ...arr.map(m => ({ role: m.role === "assistant" ? "bot" : m.role, text: m.content }))
      ]);
      setCurrentConversation(conversation_id);
    } catch (err) { console.error(err); }
  };

  const deleteConversation = async (conv_id, e) => {
    e.stopPropagation();
    if (!window.confirm("Supprimer cette conversation ?")) return;
    try {
      await fetch(`http://127.0.0.1:8000/chat/conversations/${conv_id}`, { method: "DELETE" });
      if (currentConversation === conv_id) {
        setMessages([{ role: "bot", text: "Bienvenue sur EduAI Assistant 🎓" }]);
        setCurrentConversation(null);
      }
      await loadConversations();
    } catch (err) { console.error(err); }
  };

  const startRename = (conv, e) => {
    e.stopPropagation();
    setRenamingId(conv.id);
    setRenameValue(conv.title || "");
  };

  const saveRename = async (conv_id) => {
    try {
      await fetch(`http://127.0.0.1:8000/chat/conversations/${conv_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: renameValue })
      });
      setRenamingId(null);
      await loadConversations();
    } catch (err) { setRenamingId(null); }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userText = input;
    const userId = getUserId();
    if (!userId) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userText }]);
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
      setMessages(prev => [...prev, { role: "bot", text: data.response || "⚠️ réponse vide", isNew: true }]);
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: "bot", text: "⚠️ erreur serveur" }]);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const userId = getUserId();
    if (!userId) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);
    try {
      const res = await fetch("http://127.0.0.1:8000/documents/upload-pdf", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setCurrentDocumentId(data.document_id);
      setCurrentConversation(null);
      setMessages([{ role: "bot", text: `✅ "${data.file_name}" uploadé ! Posez vos questions.` }]);
      await loadConversations();
    } catch (err) {
      setMessages(prev => [...prev, { role: "bot", text: "❌ Erreur upload." }]);
    } finally {
      setIsUploading(false);
    }
  };

  const getSummary = async () => {
  const userId = getUserId();
  if (!userId) return;
  setIsGeneratingSummary(true);
  try {
    const res = await fetch("http://127.0.0.1:8000/chat/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, document_id: currentDocumentId }),
    });
    const data = await res.json();
    setIsGeneratingSummary(false);
    const newSummary = {
      id: Date.now(),
      text: data.summary,
      title: `Résumé ${summaries.length + 1}`,
      date: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    };
    setSummaries(prev => [newSummary, ...prev]);
    setSelectedSummary(newSummary);
  } catch (err) {
    setIsGeneratingSummary(false);
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
        body: JSON.stringify({ user_id: userId, type: quizType, level: quizLevel, document_id: currentDocumentId }),
      });
      const data = await res.json();
      setIsTyping(false);
      if (data.quiz && data.quiz.length > 0) {
        setQuizQuestions(data.quiz);
      } else {
        setMessages(prev => [...prev, { role: "bot", text: "⚠️ Uploadez d'abord un PDF." }]);
      }
    } catch (err) { setIsTyping(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    navigate("/");
  };

  return (
    <div className="notebook-container">
      {quizQuestions && (
        <QuizPanel questions={quizQuestions} onClose={() => setQuizQuestions(null)} />
      )}
      {selectedSummary && (
  <SummaryPanel
    summary={selectedSummary.text}
    title={selectedSummary.title}
    onClose={() => setSelectedSummary(null)}
  />
)}
      {/* PROFILE PANEL */}
      {showProfile && (
        <div className="profile-overlay" onClick={() => setShowProfile(false)}>
          <div className="profile-panel" onClick={e => e.stopPropagation()}>
            <div className="profile-header">
              <h2>Mon profil</h2>
              <button className="profile-close" onClick={() => setShowProfile(false)}>✕</button>
            </div>
            <div className="profile-body">
              <div className="profile-avatar-section">
                <div className="profile-avatar-big">
                  {getInitials(userInfo.name)}
                </div>
                <div className="profile-name">{userInfo.name}</div>
                <div className="profile-email">{userInfo.email}</div>
              </div>

              <div className="profile-info-section">
                <div className="profile-info-title">Informations</div>
                <div className="profile-info-item">
                  <span className="profile-info-item-icon">👤</span>
                  <div className="profile-info-item-content">
                    <span className="profile-info-item-label">Nom complet</span>
                    <span className="profile-info-item-value">{userInfo.name}</span>
                  </div>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-item-icon">✉️</span>
                  <div className="profile-info-item-content">
                    <span className="profile-info-item-label">Email</span>
                    <span className="profile-info-item-value">{userInfo.email || "Non renseigné"}</span>
                  </div>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-item-icon">💬</span>
                  <div className="profile-info-item-content">
                    <span className="profile-info-item-label">Conversations</span>
                    <span className="profile-info-item-value">{conversations.length} conversations</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-footer">
              {!showLogoutConfirm ? (
                <button className="btn-logout-confirm" onClick={() => setShowLogoutConfirm(true)}>
                  🚪 Se déconnecter
                </button>
              ) : (
                <>
                  <p style={{fontSize:"13px", color:"#5f6368", textAlign:"center", marginBottom:"4px"}}>
                    Confirmer la déconnexion ?
                  </p>
                  <button className="btn-logout-confirm" onClick={handleLogout}>
                    ✅ Oui, déconnecter
                  </button>
                  <button className="btn-cancel" onClick={() => setShowLogoutConfirm(false)}>
                    ❌ Annuler
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="notebook-header">
        <div className="header-left">
          <div className="app-logo">🎓</div>
          <div className="notebook-title-wrapper">
            <h1 className="notebook-title">EduAI Assistant</h1>
            <span className="notebook-status">Système multi-agents d'apprentissage intelligent</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-profile" onClick={() => { setShowProfile(true); setShowLogoutConfirm(false); }}>
            {getInitials(userInfo.name)}
          </button>
        </div>
      </header>

      <div className="notebook-workspace">

        {/* PANNEAU GAUCHE */}
      {/* BOUTON TOGGLE SIDEBAR */}
<button
  onClick={() => setSidebarVisible(!sidebarVisible)}
  style={{
    position: "absolute",
    left: sidebarVisible ? "calc(22% + 8px)" : "14px",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 50,
    width: "24px",
    height: "48px",
    background: "white",
    border: "1px solid #e0e0e0",
    borderRadius: "0 8px 8px 0",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    color: "#5f6368",
    boxShadow: "2px 0 6px rgba(0,0,0,0.08)",
    transition: "left 0.3s ease",
  }}
>
  {sidebarVisible ? "◀" : "▶"}
</button>

{sidebarVisible && (
<aside className="panel panel-sources">
  <div className="panel-header">
    <h3>Conversations</h3>
  </div>
  <div className="panel-content">
    <button className="btn-add-source" onClick={() => {
      setMessages([{ role: "bot", text: "Nouvelle conversation 🎓" }]);
      setCurrentConversation(null);
    }}>
      + Nouvelle conversation
    </button>
    <div className="sources-list">
      {conversations.map((conv) => (
        <div
          key={conv.id}
          className={`source-item ${currentConversation === conv.id ? "active" : ""}`}
          onClick={() => loadMessages(conv.id)}
        >
          {renamingId === conv.id ? (
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => saveRename(conv.id)}
              onKeyDown={(e) => e.key === "Enter" && saveRename(conv.id)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              style={{
                flex: 1, border: "1px solid #1a73e8",
                borderRadius: "6px", padding: "2px 6px",
                fontSize: "13px", outline: "none"
              }}
            />
          ) : (
            <span className="source-item-title">
              {conv.title || "Conversation"}
            </span>
          )}
          <div className="source-item-actions">
            <button
              className="conv-action-btn"
              title="Renommer"
              onClick={(e) => startRename(conv, e)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              className="conv-action-btn delete"
              title="Supprimer"
              onClick={(e) => deleteConversation(conv.id, e)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>

    {summaries.length > 0 && (
      <>
        <div style={{
          fontSize: "11px",
          fontWeight: "600",
          color: "#5f6368",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          padding: "12px 0 4px"
        }}>
          Résumés
        </div>
        {summaries.map(s => (
          <div
            key={s.id}
            className="source-item"
            onClick={() => setSelectedSummary(s)}
            style={{ background: "#f0f9f4" }}
          >
            <span className="source-item-title">📝 {s.title} · {s.date}</span>
          </div>
        ))}
      </>
    )}

  </div>
</aside>
)}

        {/* PANNEAU CENTRE */}
        <main className="panel panel-discussion">
          <div className="chat-area">
            <div className="messages-container">
              {messages.map((msg, index) => (
                <div key={index} className={`message-row ${msg.role === "user" ? "user-row" : "bot-row"}`}>
                  <div className={`message-avatar ${msg.role}`}>
                    {msg.role === "user" ? getInitials(userInfo.name) : "AI"}
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
                  <div className="message-avatar bot">AI</div>
                  <div className="message-bubble-content">
                    <div className="chatgpt-typing-indicator">
                      <span></span><span></span><span></span>
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
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendMessage(); } }}
                placeholder="Posez une question sur votre cours..."
                className="chat-input-field"
              />
              <button
                type="button"
                className={`chat-send-btn ${input.trim() ? "active" : ""}`}
                onClick={sendMessage}
              >➤</button>
            </div>
            <div className="disclaimer-text">EduAI peut se tromper. Vérifiez les informations importantes.</div>
          </div>
        </main>

        {/* PANNEAU DROIT — Style NotebookLM */}
        <aside className="panel panel-studio">
          <div className="panel-header">
            <h3>Studio</h3>
          </div>
          <div className="panel-content">

            {/* Upload PDF */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={isUploading}
            />

            <div className="studio-tool-card upload-card" onClick={() => fileInputRef.current.click()}>
              <span className="studio-tool-icon">📄</span>
              <div>
                <div className="studio-tool-label">Ajouter un PDF</div>
                <div className="upload-subtitle">Cliquez pour choisir</div>
              </div>
            </div>

            {isUploading && (
              <div className="upload-progress">
                <div className="upload-spinner"></div>
                Traitement en cours...
              </div>
            )}

            <div className="studio-section-title">Outils IA</div>

            <div className="studio-grid">
              <div className="studio-tool-card" onClick={getSummary}>
  <span className="studio-tool-icon">
    {isGeneratingSummary ? "⏳" : "📝"}
  </span>
  <span className="studio-tool-label">
    {isGeneratingSummary ? "Génération..." : "Résumé"}
  </span>
</div>

              <div className="studio-tool-card" onClick={() => { setQuizType("qcm"); getQuiz(); }}>
                <span className="studio-tool-icon">❓</span>
                <span className="studio-tool-label">Quiz QCM</span>
              </div>

              <div className="studio-tool-card" onClick={() => { setQuizType("vrai_faux"); getQuiz(); }}>
                <span className="studio-tool-icon">✅</span>
                <span className="studio-tool-label">Vrai / Faux</span>
              </div>

              <div className="studio-tool-card" onClick={getSummary}>
                <span className="studio-tool-icon">🗂️</span>
                <span className="studio-tool-label">Points clés</span>
              </div>
            </div>

            <div className="studio-section-title">Niveau du quiz</div>
            <div className="quiz-options">
              <select value={quizLevel} onChange={(e) => setQuizLevel(e.target.value)}>
                <option value="facile">😊 Facile</option>
                <option value="moyen">🎯 Moyen</option>
                <option value="difficile">🔥 Difficile</option>
              </select>
              <button className="btn-generate-quiz" onClick={getQuiz}>
                Générer le Quiz
              </button>
            </div>

          </div>
        </aside>

      </div>
    </div>
  );
}

export default Chat;