# La Bavure D'Argos — Documentation

## Stack technique

- **Front** : React + Vite + TypeScript
- **Back** : Node.js + Express + Prisma
- **DB** : PostgreSQL
- **Reverse proxy** : Traefik (SSL automatique via Let's Encrypt)
- **Conteneurisation** : Docker + Docker Compose

---

## Prérequis

- Un VPS sous Ubuntu 24.04
- Docker installé
- Un nom de domaine avec un enregistrement DNS A pointant vers l'IP du VPS (TTL à 300)
- Git installé

---

## 1. Première installation sur le VPS

### Connexion et création d'un utilisateur

```bash
ssh root@ton-ip-vps

adduser william
usermod -aG sudo william
usermod -aG docker william

# Se reconnecter avec le nouvel utilisateur
su - william
```

### Clé SSH (depuis ta machine locale)

```bash
ssh-keygen -t ed25519 -C "william@labavure"
ssh-copy-id william@ton-ip-vps
ssh william@ton-ip-vps
```

### Installation de Docker

```bash
curl -fsSL https://get.docker.com | sh
```

---

## 2. Configuration de Traefik (une seule fois)

Traefik est le reverse proxy qui gère le routing et les certificats SSL pour tous tes projets.

### Créer le réseau Docker partagé

```bash
docker network create web
```

### Créer le fichier de configuration Traefik

```bash
nano ~/docker-compose.traefik.yml
```

```yaml
services:
  traefik:
    image: traefik:v3
    dns:
      - 8.8.8.8
      - 1.1.1.1
    ports:
      - "80:80"
      - "443:443"
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=tonemail@gmail.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./acme.json:/acme.json
    networks:
      - web

networks:
  web:
    external: true
```

> ⚠️ Le `dns: [8.8.8.8, 1.1.1.1]` est indispensable pour que Traefik puisse contacter Let's Encrypt depuis le conteneur.

### Créer le fichier acme.json (certificats SSL)

```bash
touch ~/acme.json
chmod 600 ~/acme.json
```

### Lancer Traefik

```bash
docker compose -f ~/docker-compose.traefik.yml up -d
```

### Vérifier que Traefik tourne

```bash
docker compose -f ~/docker-compose.traefik.yml ps
```

---

## 3. Déploiement de La Bavure

### Cloner le repo

```bash
cd ~
git clone ton-url-repo
cd la-bavure
```

### Créer le fichier .env

```bash
nano .env
```

```env
POSTGRES_USER=william
POSTGRES_PASSWORD=tonmdp
POSTGRES_DB=labavure
DATABASE_URL="postgresql://william:tonmdp@postgres:5432/labavure"
```

> ⚠️ Si le mot de passe contient des caractères spéciaux (`!`, `@`, `#`...), mettre `DATABASE_URL` entre guillemets.

### Créer les dossiers uploads

```bash
mkdir -p uploads/free_access uploads/private_access
```

### Lancer les conteneurs

```bash
docker compose up --build -d
```

### Vérifier que tout tourne

```bash
docker compose ps
```

### Créer les tables en base de données

```bash
# Option 1 — Si les migrations sont dans le repo
docker compose exec server npx prisma migrate deploy

# Option 2 — Si pas de dossier migrations (première fois)
docker compose exec server npx prisma db push
```

> ⚠️ `prisma db push` crée les tables directement depuis le schéma sans fichier de migration. À utiliser si `migrations/` n'est pas dans le repo.
> Pour éviter ce problème à l'avenir, ne pas ignorer `prisma/migrations/` dans le `.gitignore`.

---

## 4. Configuration DNS (Gandi)

Dans l'interface Gandi, ajouter un enregistrement A par sous-domaine :

```
Type  : A
Nom   : labavure-dargos
Valeur: 147.79.21.51
TTL   : 300
```

Vérifier la propagation :

```bash
ping labavure-dargos.willstiti.fr
# Doit répondre avec 147.79.21.51
```

---

## 5. Structure des fichiers

```
la-bavure/
├── client/                   # React + Vite
│   ├── Dockerfile
│   └── src/
├── server/                   # Express + Prisma
│   ├── Dockerfile
│   ├── index.js
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/       # À versionner dans git
├── nginx/
│   └── nginx.conf
├── uploads/                  # Images (non versionné)
│   ├── free_access/
│   └── private_access/
├── docker-compose.yml
├── .env                      # Non versionné
└── .gitignore
```

---

## 6. Variables d'environnement front (React)

Pour que le front pointe vers la bonne API en prod, créer `client/.env.production` :

```env
VITE_API_URL=https://labavure-dargos.willstiti.fr
```

Et dans le code React remplacer les `http://localhost:3001` par :

```ts
const API = import.meta.env.VITE_API_URL || "http://localhost:3001"
```

---

## 7. Mise à jour du site

```bash
cd ~/la-bavure
git pull
docker compose up --build -d
```

---

## 8. Ajouter un nouveau site sur le même VPS

### Configurer le DNS sur Gandi

```
Type  : A
Nom   : nouveau-site
Valeur: 147.79.21.51
TTL   : 300
```

### Créer le docker-compose.yml du nouveau site

Chaque nouveau site doit :
1. Utiliser le réseau `web` external
2. Avoir des labels Traefik avec un **nom de router unique**
3. Être dans son propre dossier

```yaml
services:
  client:
    build: .
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.NOM-UNIQUE.rule=Host(`sous-domaine.willstiti.fr`)"
      - "traefik.http.routers.NOM-UNIQUE.entrypoints=websecure"
      - "traefik.http.routers.NOM-UNIQUE.tls.certresolver=letsencrypt"
    networks:
      - web

networks:
  web:
    external: true
```

### Lancer le nouveau site

```bash
cd ~/nouveau-site
docker compose up --build -d
```

---

## 9. Commandes utiles

```bash
# Voir les conteneurs qui tournent
docker compose ps

# Voir les logs en temps réel
docker compose logs -f

# Voir les logs d'un conteneur spécifique
docker compose logs -f server

# Redémarrer un conteneur
docker compose restart server

# Arrêter tous les conteneurs
docker compose down

# Arrêter et supprimer les volumes (⚠️ supprime la DB)
docker compose down -v

# Accéder au shell d'un conteneur
docker compose exec server sh

# Voir tous les réseaux Docker
docker network ls

# Voir tous les conteneurs (même arrêtés)
docker ps -a

# Vérifier les ports ouverts
sudo ss -tlnp | grep -E '80|443'
```

---

## 10. Prisma

```bash
# Créer les tables depuis le schéma (première fois en prod sans migrations)
docker compose exec server npx prisma db push

# Appliquer les migrations en prod
docker compose exec server npx prisma migrate deploy

# Créer une nouvelle migration (en local uniquement)
cd server
npx prisma migrate dev --name nom_migration

# Ouvrir Prisma Studio (en local uniquement)
npx prisma studio
```

---

## 11. Uploads

Les fichiers uploadés sont stockés dans `~/la-bavure/uploads/` sur le VPS.
Ce dossier est monté en volume Docker — il persiste même si les conteneurs sont reconstruits.

```bash
# Lister les fichiers
ls ~/la-bavure/uploads/free_access/
ls ~/la-bavure/uploads/private_access/

# Copier un fichier depuis ta machine locale vers le VPS
scp monfichier.png william@147.79.21.51:~/la-bavure/uploads/free_access/
```