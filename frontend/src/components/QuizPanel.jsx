import { useState } from "react";

function QuizPanel({ questions, onClose }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answered, setAnswered] = useState(false);

  const question = questions[current];

  const handleAnswer = (option) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    if (option === question.answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent((prev) => prev + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const getColor = (option) => {
    if (!answered) return "#f0f4ff";
    if (option === question.answer) return "#22c55e";
    if (option === selected) return "#ef4444";
    return "#f0f4ff";
  };

  const getTextColor = (option) => {
    if (!answered) return "#1e293b";
    if (option === question.answer) return "white";
    if (option === selected) return "white";
    return "#1e293b";
  };

  const percentage = Math.round((score / questions.length) * 100);

  if (finished) {
    return (
      <div style={styles.overlay}>
        <div style={styles.card}>
          <h2 style={styles.title}>🎯 Résultat Final</h2>
          <div style={styles.scoreCircle}>
            <span style={styles.scoreText}>{percentage}%</span>
          </div>
          <p style={styles.scoreDetail}>
            {score} bonnes réponses sur {questions.length}
          </p>
          <p style={{
            color: percentage >= 70 ? "#22c55e" : percentage >= 50 ? "#f59e0b" : "#ef4444",
            fontWeight: "bold",
            fontSize: "18px",
            marginBottom: "20px"
          }}>
            {percentage >= 70 ? "🎉 Excellent !" : percentage >= 50 ? "👍 Bien !" : "📚 Révisez encore !"}
          </p>
          <button style={styles.btnClose} onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.progress}>
          Question {current + 1} / {questions.length}
        </div>
        <h3 style={styles.question}>{question.question}</h3>
        <div style={styles.options}>
          {question.options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(option)}
              style={{
                ...styles.optionBtn,
                background: getColor(option),
                color: getTextColor(option),
                cursor: answered ? "default" : "pointer",
              }}
            >
              {option}
            </button>
          ))}
        </div>
        {answered && (
          <div style={styles.feedback}>
            {selected === question.answer
              ? "✅ Bonne réponse !"
              : `❌ Mauvaise réponse. La bonne réponse est : ${question.answer}`}
          </div>
        )}
        {answered && (
          <button style={styles.btnNext} onClick={handleNext}>
            {current + 1 >= questions.length ? "Voir le résultat" : "Question suivante →"}
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  card: {
    background: "white",
    borderRadius: "16px",
    padding: "32px",
    width: "90%",
    maxWidth: "500px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  title: {
    textAlign: "center",
    color: "#1e293b",
    marginBottom: "24px",
  },
  progress: {
    textAlign: "right",
    color: "#64748b",
    fontSize: "13px",
    marginBottom: "16px",
  },
  question: {
    color: "#1e293b",
    fontSize: "18px",
    marginBottom: "20px",
    lineHeight: "1.5",
  },
  options: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  optionBtn: {
    padding: "12px 16px",
    border: "2px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "15px",
    textAlign: "left",
    transition: "all 0.2s",
  },
  feedback: {
    marginTop: "16px",
    padding: "12px",
    borderRadius: "8px",
    background: "#f8fafc",
    color: "#1e293b",
    fontSize: "14px",
  },
  btnNext: {
    marginTop: "16px",
    width: "100%",
    padding: "12px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  scoreCircle: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "0 auto 16px",
  },
  scoreText: {
    color: "white",
    fontSize: "32px",
    fontWeight: "bold",
  },
  scoreDetail: {
    textAlign: "center",
    color: "#64748b",
    marginBottom: "8px",
  },
  btnClose: {
    width: "100%",
    padding: "12px",
    background: "#64748b",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    cursor: "pointer",
  },
};

export default QuizPanel;