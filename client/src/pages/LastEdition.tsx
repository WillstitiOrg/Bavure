import { useState, useEffect } from "react";
import Masterhead from "../components/MasterHead";
import ImageViewer from "../components/ImageViewer";

type Bavure = {
  id: number
  title: string
  imgs: string[]
}

const API = import.meta.env.VITE_API_URL || ""

export default function DerniereEdition() {
  const [bavure, setBavure] = useState<Bavure | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  useEffect(() => {
    fetch(`${API}/api/last_edition`)
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

      {bavure && (
        <div className="hp-publication">
          <div className="hp-publication-title">{bavure.title}</div>
          <div className="hp-card-img-wrap">
            {bavure.imgs.map((src, i) => (
              <img
                key={i}
                src={`${API}${src}`}
                alt={`${bavure.title} - image ${i + 1}`}
                loading="lazy"
                style={{ cursor: 'zoom-in' }}
                onClick={() => { setViewerIndex(i); setViewerOpen(true) }}
              />
            ))}
          </div>
        </div>
      )}

      {viewerOpen && bavure && (
        <ImageViewer
          imgs={bavure.imgs.map(src => `${API}${src}`)}
          index={viewerIndex}
          title={bavure.title}
          onClose={() => setViewerOpen(false)}
          onNext={() => setViewerIndex(i => Math.min(i + 1, bavure.imgs.length - 1))}
          onPrev={() => setViewerIndex(i => Math.max(i - 1, 0))}
        />
      )}

      <footer className="hp-footer">
        <span className="hp-footer-logo">La Bavure D'Argos</span>
      </footer>
    </div>
  );
}