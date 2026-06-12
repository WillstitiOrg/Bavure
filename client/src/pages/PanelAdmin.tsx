import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Masterhead from "../components/MasterHead"
import "../style/Panel.css"

type Citoyen = {
  id: number
  nom: string
  password: string
  abonne: boolean
  PremierAbonnement: string | null
  finAbonnement: string | null
  accesParutions: number[]
}

const API = import.meta.env.VITE_API_URL || "http://localhost:3001"

const randomPassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const toInputDate = (dateStr: string | null) => {
  if (!dateStr) return ""
  return new Date(dateStr).toISOString().split('T')[0]
}

export default function PanelAdmin() {
  const navigate = useNavigate()
  const [citoyens, setCitoyens] = useState<Citoyen[]>([])
  const [editId, setEditId] = useState<number | null>(null)
  const [editData, setEditData] = useState<Partial<Citoyen>>({})
  const [newCitoyen, setNewCitoyen] = useState({ nom: '', password: randomPassword() })
  const [message, setMessage] = useState("")
  const [parutionsDisponibles, setParutionsDisponibles] = useState<number[]>([]) // ← ici, dans le composant

  const load = () => {
    fetch(`${API}/api/citoyens`)
      .then(r => r.json())
      .then(setCitoyens)
  }

  useEffect(() => {
    const citoyen = JSON.parse(sessionStorage.getItem("citoyen") || "{}")
    if (citoyen.role !== "admin") navigate("/")
    load()

    // Récupère les parutions privées disponibles
    fetch(`${API}/api/files/private`)
      .then(r => r.json())
      .then((files: string[]) => {
        const nums = [...new Set(
          files
            .map(f => f.match(/^(\d+)/)?.[1])
            .filter(Boolean)
            .map(Number)
        )].sort((a, b) => a - b)
        setParutionsDisponibles(nums)
      })
  }, [])

  const flash = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(""), 3000)
  }

  const creer = async () => {
    if (!newCitoyen.nom.trim()) return
    const res = await fetch(`${API}/api/citoyens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCitoyen)
    })
    if (res.ok) {
      setNewCitoyen({ nom: '', password: randomPassword() })
      load()
      flash("Citoyen créé.")
    } else {
      const d = await res.json()
      flash(d.error)
    }
  }

  const sauvegarder = async (id: number) => {
    await fetch(`${API}/api/citoyens/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData)
    })
    setEditId(null)
    setEditData({})
    load()
    flash("Modifications sauvegardées.")
  }

  const supprimer = async (id: number) => {
    if (!confirm("Supprimer ce citoyen ?")) return
    await fetch(`${API}/api/citoyens/${id}`, { method: 'DELETE' })
    load()
    flash("Citoyen supprimé.")
  }

  const startEdit = (c: Citoyen) => {
    setEditId(c.id)
    setEditData({
      password: c.password,
      abonne: c.abonne,
      PremierAbonnement: toInputDate(c.PremierAbonnement),
      finAbonnement: toInputDate(c.finAbonnement),
      accesParutions: c.accesParutions,
    })
  }

  return (
    <div className="hp-root">
      <Masterhead />

      <div className="hp-section-rule">
        <span className="hp-section-rule-title">Panel Administration</span>
        <span className="hp-section-rule-line" />
      </div>

      {message && <div className="pa-flash">{message}</div>}

      {/* CRÉER UN CITOYEN */}
      <div className="pa-section">
        <div className="pa-section-title">Nouveau citoyen</div>
        <div className="pa-create-row">
          <div className="lp-field">
            <label>Nom (RP)</label>
            <input
              type="text"
              value={newCitoyen.nom}
              onChange={e => setNewCitoyen(p => ({ ...p, nom: e.target.value }))}
              placeholder="Nom du citoyen"
            />
          </div>
          <div className="lp-field">
            <label>Mot de passe</label>
            <div className="pa-pwd-row">
              <input
                type="text"
                value={newCitoyen.password}
                onChange={e => setNewCitoyen(p => ({ ...p, password: e.target.value }))}
              />
              <button className="pa-btn-random" onClick={() => setNewCitoyen(p => ({ ...p, password: randomPassword() }))}>
                ↺ Générer
              </button>
            </div>
          </div>
          <button className="lp-submit" onClick={creer}>Créer</button>
        </div>
      </div>

      {/* LISTE */}
      <div className="pa-section">
        <div className="pa-section-title">Citoyens ({citoyens.length})</div>
        <table className="pa-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Mot de passe</th>
              <th>Abonné</th>
              <th>Début abonnement</th>
              <th>Fin abonnement</th>
              <th>Parutions accessibles</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {citoyens.map(c => (
              <tr key={c.id}>
                <td className="pa-nom">{c.nom}</td>

                {editId === c.id ? (
                  <>
                    <td>
                      <div className="pa-pwd-row">
                        <input
                          type="text"
                          value={editData.password ?? ""}
                          onChange={e => setEditData(p => ({ ...p, password: e.target.value }))}
                        />
                        <button className="pa-btn-random" onClick={() => setEditData(p => ({ ...p, password: randomPassword() }))}>↺</button>
                      </div>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={editData.abonne ?? false}
                        onChange={e => setEditData(p => ({ ...p, abonne: e.target.checked }))}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={editData.PremierAbonnement ?? ""}
                        onChange={e => setEditData(p => ({ ...p, PremierAbonnement: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={editData.finAbonnement ?? ""}
                        onChange={e => setEditData(p => ({ ...p, finAbonnement: e.target.value }))}
                      />
                    </td>
                    <td>
                      <div className="pa-checkboxes">
                        {parutionsDisponibles.map(num => (
                          <label key={num} className="pa-checkbox-label">
                            <input
                              type="checkbox"
                              checked={editData.accesParutions?.includes(num) ?? false}
                              onChange={e => {
                                const current = editData.accesParutions ?? []
                                setEditData(p => ({
                                  ...p,
                                  accesParutions: e.target.checked
                                    ? [...current, num].sort((a, b) => a - b)
                                    : current.filter(n => n !== num)
                                }))
                              }}
                            />
                            #{num}
                          </label>
                        ))}
                      </div>
                    </td>
                    <td className="pa-actions">
                      <button className="pa-btn-save" onClick={() => sauvegarder(c.id)}>✓ Sauver</button>
                      <button className="pa-btn-cancel" onClick={() => setEditId(null)}>✕</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="pa-pwd">{c.password}</td>
                    <td>{c.abonne ? "✓ Oui" : "Non"}</td>
                    <td>{c.PremierAbonnement ? toInputDate(c.PremierAbonnement) : "—"}</td>
                    <td>{c.finAbonnement ? toInputDate(c.finAbonnement) : "—"}</td>
                    <td>{c.accesParutions?.length > 0 ? c.accesParutions.map(n => `#${n}`).join(' · ') : "—"}</td>
                    <td className="pa-actions">
                      <button className="pa-btn-edit" onClick={() => startEdit(c)}>Modifier</button>
                      <button className="pa-btn-delete" onClick={() => supprimer(c.id)}>Supprimer</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="hp-footer">
        <span className="hp-footer-logo">La Bavure D'Argos</span>
      </footer>
    </div>
  )
}