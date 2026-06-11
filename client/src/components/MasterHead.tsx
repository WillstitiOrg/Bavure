import { useNavigate } from "react-router-dom";

export default function Masthead() {
  const navigate = useNavigate();
  const citoyen = JSON.parse(sessionStorage.getItem("citoyen") || "null");

  const deconnexion = () => {
    sessionStorage.removeItem("citoyen");
    navigate("/");
  };

  const handleDerniereEdition = () => {
    if (citoyen?.abonne) {
      navigate("/nouvelle-edition");
    } else {
      navigate("/login");
    }
  };

  return (
    <header className="hp-masthead">
      <div className="hp-masthead-title">La Bavure</div>
      <div className="hp-masthead-rule">
        <span className="hp-masthead-ornament">❧</span>
      </div>
      <div className="hp-masthead-tagline">Presse n°1 d'Argos</div>
      <nav className="hp-masthead-nav">
        <a onClick={() => navigate("/")}>Accueil</a>
        <a onClick={handleDerniereEdition}>Dernière Edition</a>
        {citoyen ? (
          <a onClick={() => navigate("/newspapers")}>Votre collection</a>
        ) : (
          <a onClick={() => navigate("/login")}>Se connecter</a>
        )}
        {citoyen && (
          <a onClick={deconnexion} className="hp-masthead-deco">
            ✕ Déconnexion ({citoyen.nom})
          </a>
        )}
      </nav>
    </header>
  );
}