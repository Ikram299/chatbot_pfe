import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Chat.css";

function Chat() {
  const navigate = useNavigate();

  // Messages du chat
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Bienvenue sur EduAI Assistant 🎓 Posez une question sur vos cours ou vos documents."
    }
  ]);

  const [input, setInput] = useState("");

  // Sources pédagogiques
  const [sources, setSources] = useState([
    { id: 1, name: "Cours_Mitose_Biologie.pdf", type: "pdf" },
    { id: 2, name: "Notes_Philosophie_Texte.txt", type: "text" }
  ]);

  // Envoyer message
  const sendMessage = () => {
    if (!input.trim()) return;

    const newMsg = {
      role: "user",
      text: input,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    // réponse simulée IA
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Analyse en cours des documents académiques... Voici une réponse basée sur vos cours."
        }
      ]);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  // logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // ajouter source
  const handleAddSource = () => {
    const sourceName = prompt("Nom du document ou lien de la source :");

    if (sourceName) {
      setSources((prev) => [
        ...prev,
        { id: Date.now(), name: sourceName, type: "web" }
      ]);
    }
  };

  return (
    <div className="notebook-container">

      {/* HEADER */}
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
          <button className="btn-action secondary">🔗 Partager</button>
          <button className="btn-action logout" onClick={handleLogout}>
            🚪
          </button>
        </div>
      </header>

      {/* WORKSPACE */}
      <div className="notebook-workspace">

        {/* SOURCES */}
        <aside className="panel panel-sources">
          <div className="panel-header">
            <h3>Sources pédagogiques</h3>
            <span className="source-count">{sources.length}</span>
          </div>

          <div className="panel-content">

            <button className="btn-add-source" onClick={handleAddSource}>
              ➕ Ajouter une source
            </button>

            <div className="sources-list">
              {sources.map((source) => (
                <div key={source.id} className="source-item">
                  <span>
                    {source.type === "pdf"
                      ? "📄"
                      : source.type === "text"
                      ? "📝"
                      : "🌐"}
                  </span>
                  <span className="source-name">{source.name}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* CHAT */}
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
                  <div className="message-avatar">
                    {msg.role === "user" ? "👤" : "🤖"}
                  </div>

                  <div className="message-bubble-content">
                    <p className="message-text">{msg.text}</p>
                  </div>
                </div>
              ))}

            </div>
          </div>

          {/* INPUT */}
          <div className="chat-input-wrapper">
            <div className="chat-input-container">

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Posez une question sur vos cours..."
                className="chat-input-field"
              />

              <button
                className={`chat-send-btn ${input.trim() ? "active" : ""}`}
                onClick={sendMessage}
              >
                ▲
              </button>

            </div>

            <div className="disclaimer-text">
              EduAI peut se tromper. Vérifiez les réponses importantes.
            </div>
          </div>

        </main>

        {/* STUDIO */}
        <aside className="panel panel-studio">

          <div className="panel-header">
            <h3>Studio académique</h3>
          </div>

          <div className="panel-content">

            <button className="studio-card card-blue">
              📊 Résumé de cours
            </button>

            <button className="studio-card card-green">
              📝 Fiches de révision
            </button>

            <button className="studio-card card-yellow">
              🎯 Génération de Quiz
            </button>

            <button className="studio-card card-purple">
              📈 Analyse des documents
            </button>

          </div>

        </aside>

      </div>
    </div>
  );
}

export default Chat;