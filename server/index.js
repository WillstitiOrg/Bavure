const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/uploads/private_access', express.static(path.join(__dirname, '../uploads/private_access')))

app.post('/api/login', async (req, res) => {
  const { nom, password } = req.body

  const citoyen = await prisma.citoyen.findUnique({
    where: { nom }
  })

  if (!citoyen || citoyen.password !== password) {
    return res.status(401).json({ error: 'Identifiants incorrects.' })
  }

  res.json({ success: true, citoyen: { id: citoyen.id, nom: citoyen.nom, abonne: citoyen.abonne, role: citoyen.nom === 'Harranu' ? 'admin' : 'user' } })
})

app.listen(3001, () => console.log('Server running on http://localhost:3001'))

app.get('/api/free_access', (req, res) => {
  const dir = path.join(__dirname, '../uploads/free_access')
  
  const files = fs.readdirSync(dir)
    .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .sort()

  // Groupe les fichiers par numéro de bavure
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

app.get('/api/private_access', async (req, res) => {
  const nom = req.query.nom

  const citoyen = await prisma.citoyen.findUnique({ where: { nom } })

  if (!citoyen || !citoyen.abonne) {
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

// Tous les citoyens
app.get('/api/citoyens', async (req, res) => {
  const citoyens = await prisma.citoyen.findMany({
    orderBy: { id: 'desc' }
  })
  res.json(citoyens)
})

// Créer un citoyen
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
    res.status(400).json({ error: 'Nom déjà pris.' })
  }
})

// Modifier un citoyen
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

// Supprimer un citoyen
app.delete('/api/citoyens/:id', async (req, res) => {
  await prisma.citoyen.delete({ where: { id: Number(req.params.id) } })
  res.json({ success: true })
})

app.get('/api/last_edition', (req, res) => {
  const dir = path.join(__dirname, '../uploads/private_access')
  
  const files = fs.readdirSync(dir)
    .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .sort()

  // Groupe les fichiers par numéro de bavure
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

app.get('/api/files/private', (req, res) => {
  const dir = path.join(__dirname, '../uploads/private_access')
  const files = fs.readdirSync(dir)
    .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .sort()
  res.json(files)
})