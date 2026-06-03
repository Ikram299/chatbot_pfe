import { useState } from "react";
import { registerUser } from "../services/api";
import { useNavigate } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await registerUser({ name, email, password });
      setSuccess("Compte créé avec succès ! Redirection...");
      
      // Petite意 temporisation pour laisser l'étudiant voir le succès avant redirection
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      setError("Erreur lors de l'inscription. L'email est peut-être déjà utilisé.");
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        {/* En-tête Académique */}
        <div style={styles.header}>
          <div style={styles.logoSquare}>🚀</div>
          <h2 style={styles.title}>Rejoindre EduAI</h2>
          <p style={styles.subtitle}>Créez votre compte étudiant en quelques secondes</p>
        </div>

        {/* Retours utilisateur (Erreur ou Succès) */}
        {error && <div style={styles.errorMessage}>{error}</div>}
        {success && <div style={styles.successMessage}>{success}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nom complet</label>
            <input
              type="text"
              placeholder="Alexandre Dupont"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Adresse email</label>
            <input
              type="email"
              placeholder="nom@universite.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <button 
            type="submit" 
            style={{...styles.button, ...(loading ? styles.buttonDisabled : {})}}
            disabled={loading}
          >
            {loading ? "Création du compte..." : "Créer mon compte"}
          </button>
        </form>

        <p style={styles.footerText}>
          Déjà inscrit ?{" "}
          <span onClick={() => navigate("/")} style={styles.link}>
            Se connecter
          </span>
        </p>
      </div>
    </div>
  );
}

// Même charte graphique que la page Login pour une cohérence parfaite
const styles = {
  pageWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    padding: "20px",
  },
  card: {
    background: "#ffffff",
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
    width: "100%",
    maxWidth: "400px",
    boxSizing: "border-box",
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  logoSquare: {
    fontSize: "32px",
    marginBottom: "12px",
  },
  title: {
    fontSize: "24px",
    color: "#1e293b",
    fontWeight: "700",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    textAlign: "left",
  },
  input: {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    backgroundColor: "#f8fafc",
    boxSizing: "border-box",
    width: "100%",
  },
  button: {
    padding: "14px",
    background: "#2563eb", // Même bleu académique
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
    marginTop: "10px",
    boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
  },
  buttonDisabled: {
    background: "#93c5fd",
    cursor: "not-allowed",
  },
  errorMessage: {
    background: "#fef2f2",
    color: "#dc2626",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "20px",
    textAlign: "center",
    border: "1px solid #fca5a5",
  },
  successMessage: {
    background: "#f0fdf4",
    color: "#16a34a",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "20px",
    textAlign: "center",
    border: "1px solid #bbf7d0",
  },
  footerText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
    marginTop: "24px",
    marginBottom: "0",
  },
  link: {
    color: "#2563eb",
    fontWeight: "600",
    cursor: "pointer",
    textDecoration: "underline",
  },
};

export default Register;