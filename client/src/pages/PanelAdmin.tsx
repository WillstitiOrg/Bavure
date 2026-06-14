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
  futurAbonnement: boolean
  nbAbonnement: number
  nouveau: boolean
}

type GroupeFichier = {
  num: number
  files: string[]
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

const grouperFichiers = (files: string[]): GroupeFichier[] => {
  const grouped: Record<number, string[]> = {}
  files.forEach(f => {
    const match = f.match(/^(\d+)/)
    if (match) {
      const num = Number(match[1])
      if (!grouped[num]) grouped[num] = []
      grouped[num].push(f)
    }
  })
  return Object.entries(grouped)
    .map(([num, files]) => ({ num: Number(num), files }))
    .sort((a, b) => a.num - b.num)
}

export default function PanelAdmin() {
  const navigate = useNavigate()
  const [citoyens, setCitoyens] = useState<Citoyen[]>([])
  const [editId, setEditId] = useState<number | null>(null)
  const [editData, setEditData] = useState<Partial<Citoyen>>({})
  const [newCitoyen, setNewCitoyen] = useState({ nom: 'Default', password: randomPassword() })
  const [message, setMessage] = useState("")
  const [parutionsDisponibles, setParutionsDisponibles] = useState<number[]>([])
  const [groupesPrivate, setGroupesPrivate] = useState<GroupeFichier[]>([])
  const [uploading, setUploading] = useState(false)

  const load = () => {
    fetch(`${API}/api/citoyens`)
      .then(r => r.json())
      .then(setCitoyens)
  }

  const loadFiles = () => {
    fetch(`${API}/api/files/private`)
      .then(r => r.json())
      .then((files: string[]) => {
        const groupes = grouperFichiers(files)
        setGroupesPrivate(groupes)
        setParutionsDisponibles(groupes.map(g => g.num))
      })
  }

  useEffect(() => {
    const citoyen = JSON.parse(sessionStorage.getItem("citoyen") || "{}")
    if (citoyen.role !== "admin") navigate("/")
    load()
    loadFiles()
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
      setNewCitoyen({ nom: 'Default', password: randomPassword() })
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
      futurAbonnement: c.futurAbonnement,
      nbAbonnement: c.nbAbonnement,
      nouveau: c.nouveau
    })
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    setUploading(true)
    const formData = new FormData()
    Array.from(e.target.files).forEach(f => formData.append('files', f))
    await fetch(`${API}/api/upload/private`, { method: 'POST', body: formData })
    setUploading(false)
    loadFiles()
    flash("Fichiers uploadés.")
  }

  const moveToFree = async (num: number) => {
    await fetch(`${API}/api/files/move-to-free`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero: num })
    })
    load()
    loadFiles()
    flash(`Bavure #${num} déplacée vers accès libre.`)
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

      {/* LISTE CITOYENS */}
      <div className="pa-section">
        <div className="pa-section-title">Citoyens ({citoyens.length})</div>
        <table className="pa-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Mot de passe</th>
              <th>Nouveau</th>
              <th>Abonné</th>
              <th>Futur abonnement</th>
              <th>Début abonnement</th>
              <th>Fin abonnement</th>
              <th>Parutions accessibles</th>
              <th>Nombre d'abonnements</th>
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
                        checked={editData.nouveau ?? false}
                        onChange={e => setEditData(p => ({ ...p, nouveau: e.target.checked }))}
                      />
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
                        type="checkbox"
                        checked={editData.futurAbonnement ?? false}
                        onChange={e => setEditData(p => ({ ...p, futurAbonnement: e.target.checked }))}
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
                    <td>
                      <div className="pa-counter">
                        <button className="pa-counter-btn" onClick={() => setEditData(p => ({ ...p, nbAbonnement: Math.max(0, (p.nbAbonnement ?? 0) - 1) }))}>−</button>
                        <span className="pa-counter-value">{editData.nbAbonnement ?? 0}</span>
                        <button className="pa-counter-btn" onClick={() => setEditData(p => ({ ...p, nbAbonnement: (p.nbAbonnement ?? 0) + 1 }))}>+</button>
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
                    <td>{c.nouveau ? "✓ Oui" : "Non"}</td>
                    <td>{c.abonne ? "✓ Oui" : "Non"}</td>
                    <td>{c.futurAbonnement ? "✓ Oui" : "Non"}</td>
                    <td>{c.PremierAbonnement ? toInputDate(c.PremierAbonnement) : "—"}</td>
                    <td>{c.finAbonnement ? toInputDate(c.finAbonnement) : "—"}</td>
                    <td>{c.accesParutions?.length > 0 ? c.accesParutions.map(n => `#${n}`).join(' · ') : "—"}</td>
                    <td>{c.nbAbonnement}</td>
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

      {/* GESTION FICHIERS */}
      <div className="pa-section">
        <div className="pa-section-title">Gestion des fichiers</div>

        <div className="pa-files-upload">
          <label className="pa-upload-label">Upload vers accès privé</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleUpload}
            className="pa-file-input"
          />
          {uploading && <span className="pa-uploading">Upload en cours...</span>}
        </div>

        <div className="pa-files-col">
          <div className="pa-files-header">Privé ({groupesPrivate.length} bavures)</div>
          {groupesPrivate.length === 0 && (
            <div className="pa-file-row"><span className="pa-file-name">Aucun fichier</span></div>
          )}
          {groupesPrivate.map(({ num, files }) => (
            <div key={num} className="pa-file-row">
              <div>
                <span className="pa-file-name"><strong>Bavure #{num}</strong></span>
                <div className="pa-file-parts">{files.join(', ')}</div>
              </div>
              <button className="pa-btn-edit" onClick={() => moveToFree(num)}>
                → Accès libre
              </button>
            </div>
          ))}
        </div>
      </div>

      <footer className="hp-footer">
        <span className="hp-footer-logo">La Bavure D'Argos</span>
      </footer>
    </div>
  )
}