import { useState } from "react";
import { loginUser } from "../services/api";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
    const res = await loginUser({ email, password });

console.log("LOGIN RESPONSE:", res.data);

// token
localStorage.setItem("token", res.data.access_token);

// user id SAFE (corrigé)
const userId =
  res.data.user?.id ||
  res.data.user_id ||
  res.data.id;

if (!userId) {
  console.error("❌ user_id introuvable dans la réponse backend");
  return;
}

localStorage.setItem("user_id", userId);

console.log("USER ID STOCKÉ:", userId);

navigate("/chat");
    } catch (error) {
      setError("Email ou mot de passe incorrect");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>

        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.logoSquare}>🎓</div>
          <h2 style={styles.title}>EduAI Assistant</h2>
          <p style={styles.subtitle}>Votre compagnon d'étude intelligent</p>
        </div>

        {/* ERROR */}
        {error && <div style={styles.errorMessage}>{error}</div>}

        {/* FORM */}
        <form onSubmit={handleLogin} style={styles.form}>
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
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
            disabled={loading}
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <p style={styles.footerText}>
          Nouveau sur EduAI ?{" "}
          <span onClick={() => navigate("/register")} style={styles.link}>
            Créer un compte
          </span>
        </p>

      </div>
    </div>
  );
}


// Palette de couleurs : Bleu Académique & Minimalisme
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
    background: "#2563eb", // Beau bleu royal académique
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

export default Login;