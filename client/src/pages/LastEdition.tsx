import { useState, useEffect } from "react";
import Masterhead from "../components/MasterHead";

type Bavure = {
  id: number
  title: string
  imgs: string[]
}

export default function DerniereEdition() {
  const [bavure, setBavure] = useState<Bavure | null>(null)

  useEffect(() => {
    fetch("http://localhost:3001/api/last_edition")
      .then(res => res.json())
      .then((data: Bavure[]) => {
        if (data.length > 0) {
          const derniere = data.reduce((max, b) => b.id > max.id ? b : max, data[0])
          setBavure(derniere)
        }
      })
  }, [])

  return (
    <div className="hp-root">
      <Masterhead />

      <div className="hp-section-rule">
        <span className="hp-section-rule-title">Dernière édition</span>
        <span className="hp-section-rule-line" />
      </div>

      {bavure ? (
        <div className="hp-publication">
          <div className="hp-publication-title">{bavure.title}</div>
          <div className="hp-card-img-wrap">
            {bavure.imgs.map((src, i) => (
              <img
                key={i}
                src={`http://localhost:3001${src}`}
                alt={`${bavure.title} - image ${i + 1}`}
                loading="lazy"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="hp-publication">
          <p style={{ fontFamily: "'Courier Prime', monospace", color: "var(--ink-faded)" }}>
            Chargement...
          </p>
        </div>
      )}

      <footer className="hp-footer">
        <span className="hp-footer-logo">La Bavure D'Argos</span>
      </footer>
    </div>
  );
}