import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/Login.css";
import Masterhead from "../components/MasterHead";

export default function LoginPage() {
  const navigate = useNavigate();
  const [pseudo, setPseudo] = useState("");
  const [mdp, setMdp] = useState("");
  const [error, setError] = useState("");

const API = import.meta.env.VITE_API_URL || "http://localhost:3001"

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: pseudo, password: mdp })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      sessionStorage.setItem("citoyen", JSON.stringify(data.citoyen))

      if (data.citoyen.role === 'admin') {
        navigate("/panel_admin")
      } else {
        navigate("/newspapers")
      }

    } catch {
      setError("Impossible de contacter le serveur.");
    }
  };

  return (
    <div className="hp-root">
      <Masterhead />
      <div className="lp-root">
        <div className="lp-card">
          <div className="lp-masthead-title">La Bavure</div>
          <div className="lp-rule">❧</div>
          <div className="lp-tagline">Accès réservé aux abonnés</div>
          <form className="lp-form" onSubmit={handleLogin}>
            <div className="lp-field">
              <label htmlFor="pseudo">Nom (RP)</label>
              <input
                id="pseudo"
                type="text"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="lp-field">
              <label htmlFor="mdp">Mot de passe</label>
              <input
                id="mdp"
                type="password"
                value={mdp}
                onChange={(e) => setMdp(e.target.value)}
              />
            </div>
            {error && <div className="lp-error">{error}</div>}
            <button type="submit" className="lp-submit">
              Entrer dans la bibliothèque
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}