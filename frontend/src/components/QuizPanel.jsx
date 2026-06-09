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
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent(prev => prev + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const getOptionStyle = (option) => {
    if (!answered) return styles.optionBtn;
    if (option === question.answer) return { ...styles.optionBtn, ...styles.correct };
    if (option === selected) return { ...styles.optionBtn, ...styles.wrong };
    return { ...styles.optionBtn, ...styles.dimmed };
  };

  const getOptionIcon = (option) => {
    if (!answered) return null;
    if (option === question.answer) return "✅";
    if (option === selected) return "❌";
    return null;
  };

  const percentage = Math.round((score / questions.length) * 100);

  const getScoreColor = () => {
    if (percentage >= 70) return "#34a853";
    if (percentage >= 50) return "#fbbc04";
    return "#ea4335";
  };

  const getScoreMessage = () => {
    if (percentage >= 70) return "🎉 Excellent travail !";
    if (percentage >= 50) return "👍 Bien joué !";
    return "📚 Continuez à réviser !";
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>

        {/* Header avec bouton X */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.iconBox}>❓</div>
            <div>
              <h2 style={styles.title}>Quiz interactif</h2>
              <p style={styles.subtitle}>
                {finished ? "Résultat final" : `Question ${current + 1} sur ${questions.length}`}
              </p>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose} title="Quitter le quiz">
            ✕
          </button>
        </div>

        {/* Progress bar */}
        {!finished && (
          <div style={styles.progressBarContainer}>
            <div style={{
              ...styles.progressBarFill,
              width: `${((current) / questions.length) * 100}%`
            }} />
          </div>
        )}

        {/* Contenu */}
        <div style={styles.content}>
          {finished ? (
            /* Résultat final */
            <div style={styles.resultContainer}>
              <div style={{ ...styles.scoreCircle, borderColor: getScoreColor() }}>
                <span style={{ ...styles.scoreNumber, color: getScoreColor() }}>
                  {percentage}%
                </span>
              </div>
              <p style={styles.scoreMessage}>{getScoreMessage()}</p>
              <p style={styles.scoreDetail}>
                {score} bonne{score > 1 ? "s" : ""} réponse{score > 1 ? "s" : ""} sur {questions.length}
              </p>

              {/* Recap des questions */}
              <div style={styles.recapTitle}>Récapitulatif</div>
              {questions.map((q, i) => (
                <div key={i} style={styles.recapItem}>
                  <span style={styles.recapNum}>{i + 1}</span>
                  <span style={styles.recapText}>{q.question}</span>
                  <span style={{ fontSize: "16px" }}>
                    {i < current || finished ? "✅" : "⭕"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* Question */
            <div style={styles.questionContainer}>
              <p style={styles.questionText}>{question.question}</p>
              <div style={styles.optionsContainer}>
                {question.options.map((option, i) => (
                  <button
                    key={i}
                    style={getOptionStyle(option)}
                    onClick={() => handleAnswer(option)}
                  >
                    <span style={styles.optionLetter}>
                      {["A", "B", "C", "D"][i]}
                    </span>
                    <span style={styles.optionText}>{option}</span>
                    {getOptionIcon(option) && (
                      <span style={styles.optionIcon}>{getOptionIcon(option)}</span>
                    )}
                  </button>
                ))}
              </div>

              {answered && (
                <div style={{
                  ...styles.feedback,
                  background: selected === question.answer ? "#e6f4ea" : "#fce8e6",
                  borderColor: selected === question.answer ? "#34a853" : "#ea4335",
                  color: selected === question.answer ? "#1e7e34" : "#c0392b",
                }}>
                  {selected === question.answer
                    ? "✅ Bonne réponse !"
                    : `❌ Mauvaise réponse. La bonne réponse est : ${question.answer}`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          {!finished ? (
            <>
              <button style={styles.btnQuit} onClick={onClose}>
                Quitter
              </button>
              <button
                style={answered ? styles.btnNext : styles.btnNextDisabled}
                onClick={handleNext}
                disabled={!answered}
              >
                {current + 1 >= questions.length ? "Voir le résultat →" : "Question suivante →"}
              </button>
            </>
          ) : (
            <button style={styles.btnClose} onClick={onClose}>
              Fermer le quiz
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "20px",
  },
  card: {
    background: "white",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "560px",
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 24px",
    borderBottom: "1px solid #e8eaed",
    background: "#f8f9fa",
    borderRadius: "16px 16px 0 0",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  iconBox: {
    fontSize: "24px",
    width: "44px",
    height: "44px",
    background: "#e8f0fe",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#202124",
    margin: 0,
  },
  subtitle: {
    fontSize: "12px",
    color: "#5f6368",
    margin: "2px 0 0",
  },
  closeBtn: {
    background: "#f1f3f4",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    color: "#5f6368",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    transition: "all 0.15s",
  },
  progressBarContainer: {
    height: "4px",
    background: "#e8eaed",
    borderRadius: "0",
  },
  progressBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, #1a73e8, #7c3aed)",
    transition: "width 0.4s ease",
    borderRadius: "0",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
  },
  questionContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  questionText: {
    fontSize: "17px",
    fontWeight: "500",
    color: "#202124",
    lineHeight: "1.6",
  },
  optionsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  optionBtn: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    border: "1.5px solid #e8eaed",
    borderRadius: "12px",
    background: "white",
    cursor: "pointer",
    fontSize: "14px",
    textAlign: "left",
    transition: "all 0.2s",
    width: "100%",
  },
  correct: {
    background: "#e6f4ea",
    borderColor: "#34a853",
    cursor: "default",
  },
  wrong: {
    background: "#fce8e6",
    borderColor: "#ea4335",
    cursor: "default",
  },
  dimmed: {
    opacity: 0.5,
    cursor: "default",
  },
  optionLetter: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#f1f3f4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "700",
    color: "#5f6368",
    flexShrink: 0,
  },
  optionText: {
    flex: 1,
    color: "#202124",
    lineHeight: "1.4",
  },
  optionIcon: {
    fontSize: "16px",
    flexShrink: 0,
  },
  feedback: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid",
    fontSize: "14px",
    fontWeight: "500",
    lineHeight: "1.5",
  },
  resultContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  scoreCircle: {
    width: "110px",
    height: "110px",
    borderRadius: "50%",
    border: "4px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "8px 0",
  },
  scoreNumber: {
    fontSize: "32px",
    fontWeight: "700",
  },
  scoreMessage: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#202124",
  },
  scoreDetail: {
    fontSize: "14px",
    color: "#5f6368",
    marginBottom: "8px",
  },
  recapTitle: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#5f6368",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    alignSelf: "flex-start",
    marginTop: "8px",
  },
  recapItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    background: "#f8f9fa",
    borderRadius: "10px",
    width: "100%",
  },
  recapNum: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "#e8eaed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700",
    color: "#5f6368",
    flexShrink: 0,
  },
  recapText: {
    flex: 1,
    fontSize: "13px",
    color: "#202124",
    lineHeight: "1.4",
  },
  footer: {
    display: "flex",
    gap: "10px",
    padding: "14px 24px",
    borderTop: "1px solid #e8eaed",
    background: "#f8f9fa",
    borderRadius: "0 0 16px 16px",
  },
  btnQuit: {
    flex: 1,
    padding: "11px",
    borderRadius: "10px",
    border: "1.5px solid #e8eaed",
    background: "white",
    color: "#5f6368",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  btnNext: {
    flex: 2,
    padding: "11px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #1a73e8, #7c3aed)",
    color: "white",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  btnNextDisabled: {
    flex: 2,
    padding: "11px",
    borderRadius: "10px",
    border: "none",
    background: "#e8eaed",
    color: "#9aa0a6",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "not-allowed",
  },
  btnClose: {
    flex: 1,
    padding: "11px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #1a73e8, #7c3aed)",
    color: "white",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default QuizPanel;