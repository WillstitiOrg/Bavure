const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const multer = require('multer')

const app = express()
const prisma = new PrismaClient()

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// ─── MULTER (upload vers private_access uniquement) ───────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/private_access'))
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
})
const upload = multer({ storage })

// ─── AUTH ─────────────────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { nom, password } = req.body

  const citoyen = await prisma.citoyen.findUnique({ where: { nom } })

  if (!citoyen || citoyen.password !== password) {
    return res.status(401).json({ error: 'Identifiants incorrects.' })
  }

  res.json({
    success: true,
    citoyen: {
      id: citoyen.id,
      nom: citoyen.nom,
      abonne: citoyen.abonne,
      role: citoyen.nom === 'Harranu' ? 'admin' : 'user'
    }
  })
})

// ─── PUBLICATIONS GRATUITES ───────────────────────────────────────────────────
app.get('/api/free_access', (req, res) => {
  const dir = path.join(__dirname, '../uploads/free_access')

  const files = fs.readdirSync(dir)
    .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .sort()

  const grouped = {}
  files.forEach(file => {
    const match = file.match(/^(\d+)/)
    if (match) {
      const num = match[1]
      if (!grouped[num]) grouped[num] = []
      grouped[num].push(`/uploads/free_access/${file}`)
    }
  })

  const bavures = Object.entries(grouped).map(([num, imgs]) => ({
    id: Number(num),
    title: `Bavure #${num}`,
    imgs
  }))

  res.json(bavures)
})

// ─── PUBLICATIONS PRIVÉES ─────────────────────────────────────────────────────
app.get('/api/private_access', async (req, res) => {
  const nom = req.query.nom

  const citoyen = await prisma.citoyen.findUnique({ where: { nom } })

  if (!citoyen) {
    return res.status(403).json({ error: 'Accès refusé.' })
  }

  const dir = path.join(__dirname, '../uploads/private_access')
  const files = fs.readdirSync(dir)
    .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .sort()

  const grouped = {}
  files.forEach(file => {
    const match = file.match(/^(\d+)/)
    if (match) {
      const num = Number(match[1])
      if (citoyen.accesParutions.includes(num)) {
        if (!grouped[num]) grouped[num] = []
        grouped[num].push(`/uploads/private_access/${file}`)
      }
    }
  })

  const bavures = Object.entries(grouped).map(([num, imgs]) => ({
    id: Number(num),
    title: `Bavure #${num}`,
    imgs
  }))

  res.json(bavures)
})

// ─── DERNIÈRE ÉDITION ─────────────────────────────────────────────────────────
app.get('/api/last_edition', (req, res) => {
  const dir = path.join(__dirname, '../uploads/private_access')

  const files = fs.readdirSync(dir)
    .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .sort()

  const grouped = {}
  files.forEach(file => {
    const match = file.match(/^(\d+)/)
    if (match) {
      const num = match[1]
      if (!grouped[num]) grouped[num] = []
      grouped[num].push(`/uploads/private_access/${file}`)
    }
  })

  const bavures = Object.entries(grouped).map(([num, imgs]) => ({
    id: Number(num),
    title: `Bavure #${num}`,
    imgs
  }))

  res.json(bavures)
})

// ─── CITOYENS ─────────────────────────────────────────────────────────────────
app.get('/api/citoyens', async (req, res) => {
  const citoyens = await prisma.citoyen.findMany({ orderBy: { id: 'desc' } })
  res.json(citoyens)
})

app.post('/api/citoyens', async (req, res) => {
  const { nom, password, abonne, PremierAbonnement, finAbonnement } = req.body
  try {
    const citoyen = await prisma.citoyen.create({
      data: {
        nom,
        password,
        abonne: abonne ?? false,
        PremierAbonnement: PremierAbonnement ? new Date(PremierAbonnement) : null,
        finAbonnement: finAbonnement ? new Date(finAbonnement) : null,
      }
    })
    res.json(citoyen)
  } catch (e) {
    console.error(e)
    res.status(400).json({ error: 'Nom déjà pris.' })
  }
})

app.put('/api/citoyens/:id', async (req, res) => {
  const { password, abonne, PremierAbonnement, finAbonnement, accesParutions } = req.body
  const citoyen = await prisma.citoyen.update({
    where: { id: Number(req.params.id) },
    data: {
      ...(password && { password }),
      ...(abonne !== undefined && { abonne }),
      ...(PremierAbonnement !== undefined && { PremierAbonnement: PremierAbonnement ? new Date(PremierAbonnement) : null }),
      ...(finAbonnement !== undefined && { finAbonnement: finAbonnement ? new Date(finAbonnement) : null }),
      ...(accesParutions !== undefined && { accesParutions }),
    }
  })
  res.json(citoyen)
})

app.delete('/api/citoyens/:id', async (req, res) => {
  await prisma.citoyen.delete({ where: { id: Number(req.params.id) } })
  res.json({ success: true })
})

// ─── GESTION FICHIERS (ADMIN) ─────────────────────────────────────────────────

// Lister les fichiers private
app.get('/api/files/private', (req, res) => {
  const dir = path.join(__dirname, '../uploads/private_access')
  const files = fs.readdirSync(dir)
    .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .sort()
  res.json(files)
})

// Upload vers private_access
app.post('/api/upload/private', upload.array('files'), (req, res) => {
  res.json({ success: true, files: req.files.map(f => f.originalname) })
})

// Déplacer private → free
app.post('/api/files/move-to-free', async (req, res) => {
  const { numero } = req.body  // ← on reçoit un numéro, pas un filename

  const srcDir = path.join(__dirname, '../uploads/private_access')
  const destDir = path.join(__dirname, '../uploads/free_access')

  try {
    // Trouve tous les fichiers qui commencent par ce numéro
    const files = fs.readdirSync(srcDir)
      .filter(f => f.match(new RegExp(`^${numero}[^\\d]|^${numero}\\.`)))

    if (files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier trouvé pour ce numéro.' })
    }

    files.forEach(f => {
      fs.renameSync(
        path.join(srcDir, f),
        path.join(destDir, f)
      )
    })

    // Retire le numéro de accesParutions de tous les citoyens
    const citoyens = await prisma.citoyen.findMany({
      where: { accesParutions: { has: numero } }
    })

    await Promise.all(citoyens.map(c =>
      prisma.citoyen.update({
        where: { id: c.id },
        data: { accesParutions: c.accesParutions.filter(n => n !== numero) }
      })
    ))

    res.json({ success: true, moved: files })
  } catch (e) {
    console.error(e)
    res.status(400).json({ error: 'Erreur lors du déplacement.' })
  }
})

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(3001, () => console.log('Server running on http://localhost:3001'))