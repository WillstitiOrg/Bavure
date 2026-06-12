import { useState, useEffect } from "react";
import Masterhead from "../components/MasterHead";

type Bavure = {
  id: number
  title: string
  imgs: string[]
}

const API = import.meta.env.VITE_API_URL || "http://localhost:3001"

export default function HomePage() {
  const [bavures, setBavures] = useState<Bavure[]>([])
  const [selectedId, setSelectedId] = useState<number>(1)

  useEffect(() => {
    fetch(`${API}/api/free_access`)
      .then(res => res.json())
      .then(data => {
        setBavures(data)
        if (data.length > 0) setSelectedId(data[0].id)
      })
  }, [])

  const current = bavures.find((a) => a.id === selectedId)

  return (
    <div className="hp-root">
      <Masterhead />

      <div className="hp-section-rule">
        <span className="hp-section-rule-title">Archives :</span>
        <span className="hp-section-rule-line" />
      </div>

      <div className="hp-picker-wrap">
        <label className="hp-picker-label" htmlFor="edition-picker">
          Choisir une édition
        </label>
        <select
          id="edition-picker"
          className="hp-picker-select"
          value={selectedId}
          onChange={(e) => setSelectedId(Number(e.target.value))}
        >
          {bavures.map((a) => (
            <option key={a.id} value={a.id}>{a.title}</option>
          ))}
        </select>
      </div>

      {current && (
        <div className="hp-publication">
          <div className="hp-publication-title">{current.title}</div>
          <div className="hp-card-img-wrap">
            {current.imgs.map((src, i) => (
              <img
                key={i}
                src={`${API}${src}`}
                alt={`${current.title} - image ${i + 1}`}
                loading="lazy"
              />
            ))}
          </div>
        </div>
      )}

      <footer className="hp-footer">
        <span className="hp-footer-logo">La Bavure D'Argos</span>
      </footer>
    </div>
  );
}