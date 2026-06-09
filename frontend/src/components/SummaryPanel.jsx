import jsPDF from "jspdf";

function SummaryPanel({ summary, title, onClose }) {

  const cleanText = (text) => {
    return text
      .replace(/#{1,6} /g, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .trim();
  };

  const formatLines = (text) => {
    if (!text) return [];
    return text.split("\n").map((line, i) => {
      const clean = line
        .replace(/#{1,6} /g, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/`(.+?)`/g, "$1");

      if (line.startsWith("# ") || line.startsWith("## ")) {
        return <h2 key={i} style={styles.sectionTitle}>{clean}</h2>;
      }
      if (line.startsWith("### ")) {
        return <h3 key={i} style={styles.subTitle}>{clean}</h3>;
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <div key={i} style={styles.bullet}>
            <span style={styles.dot}>•</span>
            <span style={styles.bulletText}>{clean.replace(/^[-*] /, "")}</span>
          </div>
        );
      }
      if (line.trim() === "") return <div key={i} style={{ height: "6px" }} />;
      return <p key={i} style={styles.paragraph}>{clean}</p>;
    });
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Résumé du cours", margin, y);
    y += 12;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    const cleaned = cleanText(summary);
    const lines = doc.splitTextToSize(cleaned, maxWidth);

    lines.forEach((line) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 7;
    });

    doc.save("resume_cours.pdf");
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.iconBox}>📝</div>
            <div>
              <h2 style={styles.title}>Résumé du cours</h2>
              <p style={styles.subtitle}>{title || "Document analysé"}</p>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {formatLines(summary)}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button style={styles.btnDownload} onClick={downloadPDF}>
            ⬇️ Télécharger PDF
          </button>
          <button style={styles.btnCopy} onClick={() => {
            navigator.clipboard.writeText(cleanText(summary));
            alert("✅ Résumé copié !");
          }}>
            📋 Copier
          </button>
          <button style={styles.btnClose} onClick={onClose}>
            Fermer
          </button>
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
    maxWidth: "640px",
    maxHeight: "82vh",
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
    fontSize: "28px",
    width: "48px",
    height: "48px",
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
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#5f6368",
    padding: "6px 10px",
    borderRadius: "8px",
    transition: "background 0.15s",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 28px",
    display: "flex",
    flexDirection: "column",
  },
  sectionTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#202124",
    margin: "14px 0 6px",
    paddingBottom: "6px",
    borderBottom: "1px solid #e8eaed",
  },
  subTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#202124",
    margin: "10px 0 4px",
  },
  paragraph: {
    fontSize: "14px",
    lineHeight: "1.75",
    color: "#3c4043",
    margin: "3px 0",
  },
  bullet: {
    display: "flex",
    gap: "10px",
    fontSize: "14px",
    lineHeight: "1.75",
    color: "#3c4043",
    paddingLeft: "8px",
    margin: "2px 0",
  },
  dot: {
    color: "#1a73e8",
    fontWeight: "700",
    flexShrink: 0,
    marginTop: "1px",
  },
  bulletText: { flex: 1 },
  footer: {
    display: "flex",
    gap: "8px",
    padding: "14px 24px",
    borderTop: "1px solid #e8eaed",
    background: "#f8f9fa",
    borderRadius: "0 0 16px 16px",
  },
  btnDownload: {
    flex: 1,
    padding: "10px",
    borderRadius: "10px",
    border: "1.5px solid #34a853",
    background: "white",
    color: "#34a853",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  btnCopy: {
    flex: 1,
    padding: "10px",
    borderRadius: "10px",
    border: "1.5px solid #1a73e8",
    background: "white",
    color: "#1a73e8",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  btnClose: {
    flex: 1,
    padding: "10px",
    borderRadius: "10px",
    border: "none",
    background: "#1a73e8",
    color: "white",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default SummaryPanel;