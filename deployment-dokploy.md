# 🚀 FluentUp - Complete Hostinger VPS & Dokploy Deployment Guide
*(Shuru se aakhiri step tak - Zero Error Guide for Beginners)*

Yeh document **FluentUp Mobile App Backend** ko **Hostinger VPS** par **Dokploy** ke zariye self-host karne ka sabse asaan aur complete master guide hai. Is guide ko follow karke koi bhi bina kisi error ke apna pura backend, database, aur real-time WebSockets 100% apne control me live kar sakta hai.

---

## 📑 Table of Contents (Index)

1. [Architectural Overview (Ye Kaam Kaise Karta Hai?)](#1-architectural-overview)
2. [Phase 1: Hostinger se Domain aur VPS Kharidna](#phase-1-hostinger-se-domain-aur-vps-kharidna)
3. [Phase 2: Domain DNS Setup (Hostinger DNS Record Pointing)](#phase-2-domain-dns-setup)
4. [Phase 3: VPS Setup aur Dokploy Installation (Sirf 1 Command)](#phase-3-vps-setup-aur-dokploy-installation)
5. [Phase 4: Dokploy Admin Dashboard Initial Setup](#phase-4-dokploy-admin-dashboard-initial-setup)
6. [Phase 5: PostgreSQL aur Redis Database 1-Click Setup](#phase-5-postgresql-aur-redis-database-1-click-setup)
7. [Phase 6: FluentUp Backend Deploy Karna (GitHub Integration)](#phase-6-fluentup-backend-deploy-karna)
8. [Phase 7: Domain Connect Karna aur Free SSL (HTTPS & WSS)](#phase-7-domain-connect-karna-aur-free-ssl)
9. [Phase 8: Database Migration (Prisma Setup)](#phase-8-database-migration-prisma-setup)
10. [Phase 9: Mobile App me Backend URL Update Karna](#phase-9-mobile-app-me-backend-url-update-karna)
11. [Phase 10: Automatic Backups aur Security Hardening](#phase-10-automatic-backups-aur-security-hardening)
12. [Troubleshooting & Common Errors (Aasan Solutions)](#troubleshooting--common-errors)

---

## 1. Architectural Overview

FluentUp ek high-performance real-time audio-calling aur matchmaking app hai. Iske do main hisse hain:

```
┌─────────────────────────────────────────────────────────┐
│              User ka Android / iOS Mobile App           │
│        (React Native / Expo - APK ya Play Store)        │
└────────────────────────────┬────────────────────────────┘
                             │  HTTPS (REST APIs) & WSS (Socket.io)
                             ▼
┌─────────────────────────────────────────────────────────┐
│             HOSTINGER VPS (Ubuntu 24.04 LTS)            │
│  ┌───────────────────────────────────────────────────┐  │
│  │                DOKPLOY PLATFORM                   │  │
│  │                                                   │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────┐  │  │
│  │  │   NestJS     │  │  PostgreSQL  │  │  Redis  │  │  │
│  │  │   Backend    │◄─┼─►  Database  │  │  Queue  │  │  │
│  │  │ (Port 3000)  │  │ (Port 5432)  │  │ (6379)  │  │  │
│  │  └──────▲───────┘  └──────────────┘  └─────────┘  │  │
│  │         │                                         │  │
│  │  ┌──────┴───────────────────────────────────────┐ │  │
│  │  │   Traefik Reverse Proxy (Auto Free SSL Cert) │ │  │
│  │  └──────────────────────▲───────────────────────┘ │  │
│  └─────────────────────────┼─────────────────────────┘  │
└────────────────────────────┼────────────────────────────┘
                             │
                  api.aapkadomain.com
```

### Is Setup ke Fayde:
- **Zero Cold Start:** Render ya Free tiers 15 minute baad so jate the; yahan server 24/7 bina ruke chalega.
- **Full Control:** Database, Redis aur code sab aapke private server par hoga.
- **Cost Effective:** Render/Railway par DB + Redis + Node ka ₹3000+/month lagta hai, Hostinger VPS par sirf ₹450-₹550/month me sab include hota hai.
- **Unlimited WebSockets:** Instant call matchmaking bina connection limit ke.

---

## Phase 1: Hostinger se Domain aur VPS Kharidna

### Step 1.1: Domain Kharidna
1. Browser me open karein: **[https://www.hostinger.in/domain-checker](https://www.hostinger.in/domain-checker)**
2. Apna pasandida domain search karein (jaise: `fluentup.in`, `fluentup.app`, ya `fluentup.com`).
   > 💡 *Tip:* Agar budget kam hai, to `.in` ya `.online` ya `.xyz` ₹150 se ₹499 me mil jata hai.
3. Cart me add karein, apna account banayein aur payment (UPI/Card/NetBanking) se complete karein.

---

### Step 1.2: VPS (Virtual Private Server) Kharidna
1. Hostinger menu me **VPS** par click karein: **[https://www.hostinger.in/vps-hosting](https://www.hostinger.in/vps-hosting)**
2. **Recommended Plan:** **KVM 2** 
   - **Specs:** 2 vCPU Cores, 8 GB RAM, 100 GB NVMe Disk space.
   - *Kyu zaroori hai:* NestJS build hote waqt, PostgreSQL aur Redis ko milakar 2 GB se zyada RAM chahiye hoti hai. 8 GB RAM me aapka app bina kisi lag ke hazaro concurrent users handle kar lega.
   - *(Budget kam ho to KVM 1 bhi chalega jisme 4 GB RAM milti hai).*
3. Billing Cycle choose karein (12 Months ya 1 Month).
4. Payment karein.

---

### Step 1.3: VPS Initial Setup Wizard (Hostinger Dashboard)
Payment ke baad Hostinger aapse server setup karne ko kahega:

1. **Server Location:**
   - Choose: **India (Mumbai)** 🇮🇳
   - *(India location select karne se Indian users ke liye video/audio call latency sabse fast - under 25ms rahegi).*
2. **Operating System Selection (⚠️ Sabse Zaroori Step):**
   - Click karein **Plain OS** (Koi Panel mat select karna jaise cPanel ya CyberPanel).
   - Select karein: **Ubuntu 22.04 64bit** ya **Ubuntu 24.04 64bit**.
3. **Set Root Password:**
   - Ek strong password banayein (jaise: `FluentUp@Server2026!#`).
   - *Isko kahi safe jagah save kar lein, yeh server me login karne ke kaam aayega.*
4. **Finish Setup** par click karein.
   - 2 minute me aapka server ready ho jayega aur aapko screen par **VPS IP Address** (e.g. `194.164.xx.xx`) dikhega.

---

## Phase 2: Domain DNS Setup

Ab hum apne domain ko Hostinger VPS ki IP se jodenge taaki `api.yourdomain.com` likhne par aapka VPS open ho.

1. Hostinger Dashboard me upar **Domains** par click karein.
2. Apne domain ke samne **Manage** button par click karein.
3. Left sidebar me **DNS / Nameservers** par click karein.
4. **Manage DNS Records** section me niche diye gaye **2 Records** add karein:

| Type | Name | Points to / Value | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `api` | Aapke VPS ki IP (e.g. `194.164.xx.xx`) | 300 (ya Default) |
| **A** | `dokploy` | Aapke VPS ki IP (e.g. `194.164.xx.xx`) | 300 (ya Default) |

> 📌 **Matlab samjhein:**
> - `api.yourdomain.com` -> Yeh aapke FluentUp backend REST API aur Socket.io call signaling ke liye use hoga.
> - `dokploy.yourdomain.com` -> Yeh aapke Dokploy management control panel ke liye use hoga.

*Save records karein. 5 se 10 minute me DNS poori duniya me live ho jata hai.*

---

## Phase 3: VPS Setup aur Dokploy Installation

Ab hum apne computer se VPS me login karenge aur Dokploy install karenge.

### Step 3.1: Terminal se Server me Login Karein
Apne Windows computer me **PowerShell** ya **Command Prompt (CMD)** open karein aur type karein:

```bash
ssh root@AAPKI_VPS_IP
```
*(Example: `ssh root@194.164.50.120`)*

- Pehli baar aayega: `Are you sure you want to continue connecting (yes/no/[fingerprint])?` -> Type karein: `yes` aur Enter dabayein.
- Ab aapse **Password** mangega: Hostinger setup me jo Root Password banaya tha wo enter karein.
  *(Note: Linux me password type karte waqt screen par characters nahi dikhte, bas sahi password type karke Enter dabayein).*

Aap server ke andar successfully login ho chuke hain! 🎉

---

### Step 3.2: Server Update Karein
Login hote hi terminal me yeh command run karein:

```bash
apt update && apt upgrade -y
```

---

### Step 3.3: Dokploy Install Karein (Sirf 1 Command)
Ab Dokploy ka official installation script run karein:

```bash
curl -sSL https://dokploy.com/setup.sh | sh
```

**Yeh command kya karegi?**
- Automatically Docker aur Docker Compose install karegi.
- Traefik Reverse Proxy setup karegi jo Free SSL certificates manage karega.
- Dokploy ka Web Management Container start karegi.

*Isme lagbhag 2 se 3 minute lagenge. Jab installation complete ho jayegi, to terminal par aayega:*
```text
Dokploy is installed successfully!
Please open: http://YOUR_VPS_IP:3000
```

---

## Phase 4: Dokploy Admin Dashboard Initial Setup

1. Apne Chrome/Edge browser me new tab open karein:
   ```text
   http://AAPKI_VPS_IP:3000
   ```
2. First-time setup screen dikhegi:
   - **Name:** Apna naam enter karein (e.g., `Admin`).
   - **Email:** Apna active email enter karein.
   - **Password:** Strong password banayein aur save karein.
3. **Create Admin Account** par click karein.
4. Ab aap Dokploy ke main control panel dashboard me login ho jayenge!

---

## Phase 5: PostgreSQL aur Redis Database 1-Click Setup

FluentUp backend ko 2 databases chahiye:
1. **PostgreSQL:** User profiles, friends, call logs, assessment data save karne ke liye.
2. **Redis:** Fast 30-second live matchmaking queue aur user online presence track karne ke liye.

Dokploy me inhe terminal ke bina 1-click me banaya ja sakta hai:

### Step 5.1: PostgreSQL Banana
1. Dokploy Dashboard ke left sidebar me **"Databases"** par click karein.
2. Top right me **"Create Database"** button par click karein.
3. **Select Type:** Choose karein **PostgreSQL**.
4. **Form details fill karein:**
   - **Name:** `fluentup-postgres`
   - **Database Name:** `fluentup`
   - **Username:** `postgres`
   - **Password:** Ek strong password dalein (ya Dokploy ka auto-generated password copy karein).
5. **Create & Start** par click karein.
6. 10 second me database container green (Running) ho jayega.
7. **Internal Connection String Note Karein:**
   Dokploy ke andar containers aapas me internal network se baat karte hain. Aapka connection string aisa hoga:
   ```text
   postgresql://postgres:AAPKA_PASSWORD@fluentup-postgres:5432/fluentup?schema=public
   ```
   *(Isko copy karke Notepad me rakh lein).*

---

### Step 5.2: Redis Banana
1. Wapas **"Databases"** section me jayein.
2. Click karein **"Create Database"** -> Choose karein **Redis**.
3. **Form details:**
   - **Name:** `fluentup-redis`
   - **Password:** (Optional, agar blank chhodna chahein to Dokploy me blank bhi chalta hai ya simple password set karein).
4. **Create & Start** par click karein.
5. Container running hone ke baad internal host note karein:
   - **Redis Host:** `fluentup-redis`
   - **Redis Port:** `6379`

---

## Phase 6: FluentUp Backend Deploy Karna

Ab hum Dokploy ko aapke GitHub repository se connect karenge taaki jab bhi aap code push karein, yeh automatic deploy ho jaye.

### Step 6.1: GitHub Account Connect Karna
1. Dokploy Dashboard me left side **Settings** > **Git Providers** me jayein.
2. **GitHub** select karein aur **Install GitHub App** par click karein.
3. GitHub popup me apna account login karke Dokploy ko aapke `fluentUp` repository ki permission grant karein.

---

### Step 6.2: Dokploy me Application Banana
1. Left sidebar me **Projects** par click karein.
2. Click **Create Project** -> Name dalein: `FluentUp Production`.
3. Project open karein aur click karein **Create Service** > **Application**.
4. **Application Name:** `fluentup-backend`.

---

### Step 6.3: Source & Build Configuration
Application par click karein aur **General** / **Source** tab me configure karein:

1. **Provider:** Select `GitHub`.
2. **Repository:** Choose `Praveen31111/fluentUp` (ya aapka repo).
3. **Branch:** `main` (ya `master`).
4. **Root Directory:** 
   ```text
   /server
   ```
   *(⚠️ Dhyan dein: Hamare project me backend code `/server` folder ke andar hai, isliye root directory `/server` dalna compulsory hai).*
5. **Build Type:** Select **Nixpacks** (Yeh automatic Node.js version detect kar leta hai).

---

### Step 6.4: Build & Start Commands Set Karein
Nixpacks settings me:
- **Install Command:** `npm install`
- **Build Command:** 
  ```bash
  npx prisma generate && npm run build
  ```
- **Start Command:**
  ```bash
  npx prisma db push && npm run start:prod
  ```
  *(💡 Fayda: `npx prisma db push` har deployment par database tables ko automatically sync kar dega).*

---

### Step 6.5: Environment Variables (.env) Setup
Dokploy me **"Environment"** tab par click karein aur niche diye gaye saare variables paste karein:

```env
# Application Port & Mode
PORT=3000
NODE_ENV=production

# Database Connection (Step 5.1 se copy kiya hua)
DATABASE_URL=postgresql://postgres:AAPKA_DB_PASSWORD@fluentup-postgres:5432/fluentup?schema=public

# Redis Configuration (Step 5.2 se copy kiya hua)
REDIS_HOST=fluentup-redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Security & CORS
CORS_ORIGIN=*

# Firebase Authentication (Apne Firebase Console Service Account se)
FIREBASE_PROJECT_ID=fluentup-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@fluentup-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# WebRTC STUN & TURN Relay Servers
TURN_URLS=turn:openrelay.metered.ca:80,turn:openrelay.metered.ca:443,turn:openrelay.metered.ca:443?transport=tcp
TURN_USERNAME=openrelay
TURN_CREDENTIAL=openrelay
```

> ⚠️ **Firebase Private Key Important Tip:**
> Dokploy me `.env` paste karte waqt dhyaan rahe ki `FIREBASE_PRIVATE_KEY` double quotes (`"..."`) me ho aur uske andar real line breaks ki jagah `\n` ho, taaki formatting break na ho.

**Save** par click karein.

---

## Phase 7: Domain Connect Karna aur Free SSL

Mobile applications HTTP (unencrypted) URLs ko block karti hain. Isliye secure **HTTPS** aur **WSS (Secure WebSockets)** hona mandatory hai.

1. Dokploy me apni Application (`fluentup-backend`) ke **"Domains"** tab par jayein.
2. Click karein **"Add Domain"**.
3. **Host:** 
   ```text
   api.yourdomain.com
   ```
   *(Apna actual domain name dalein jo Phase 2 me Hostinger DNS me banaya tha).*
4. **Path:** `/`
5. **Container Port:** `3000` (Kyunki NestJS server port 3000 par listen karta hai).
6. **HTTPS:** Toggle switch ko **Enable** karein (ON karein).
7. **Certificate Provider:** Let's Encrypt choose karein.
8. Click **Save**.

Dokploy ka Traefik proxy automatically Let's Encrypt se free SSL certificate generate kar dega.

---

### Step 7.1: Deploy & Test Backend
1. Application dashboard me top-right me **"Deploy"** button par click karein.
2. **Deployments** tab me live build logs dekhein.
3. Build complete hone par status **"Running"** ho jayega.
4. Apne browser me check karein:
   ```text
   https://api.yourdomain.com/api/health
   ```
   Aapko screen par response dikhega:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-...",
     "uptime": 12.4
   }
   ```
   Agar yeh dikh gaya, to congratulations! Aapka self-hosted backend live ho chuka hai! 🚀

---

## Phase 8: Database Migration (Prisma Setup)

Agar aapke database me initial seed data (levels, topics, test assessment questions) insert karna ho:

1. Dokploy me `fluentup-backend` application me **"Terminal"** tab open karein.
2. Terminal me type karein:
   ```bash
   npx prisma db push
   ```
3. Seed chalane ke liye:
   ```bash
   npx prisma db seed
   ```
4. Terminal aayega: `Database has been seeded successfully!`

---

## Phase 9: Mobile App me Backend URL Update Karna

Ab mobile app ko Render ki jagah aapke naye Hostinger VPS backend se connect karna hai:

### Step 9.1: Mobile App Config File Edit Karein
Apne computer ke VS Code me jayein:
File open karein: `fluentUp/constants/config.ts`

Lines 10-11 me purane Render URL ko replace karein apne naye domain se:

```typescript
// ========================================================
// FluentUp - Mobile App Configuration & Server Endpoints
// ========================================================

import { Platform } from 'react-native';

// Production Cloud Backend (Hostinger VPS with Dokploy)
const CLOUD_BACKEND_URL = 'https://api.yourdomain.com'; // 👈 Apna naya domain dalein

// Local Wi-Fi testing ke liye false rakhein
const USE_LOCAL_SERVER = false;

const BASE_SERVER_URL = CLOUD_BACKEND_URL;

// HTTP REST API Base URL
export const API_BASE_URL = `${BASE_SERVER_URL}/api`;

// WebSocket Server URL (Signaling Gateway for Matchmaking & Calling)
export const WS_BASE_URL = BASE_SERVER_URL;
```

---

### Step 9.2: Mobile App Test Karein
1. Mobile app run karein:
   ```bash
   cd fluentUp
   npx expo start
   ```
2. Apne physical Android phone se Expo Go app me QR code scan karein.
3. Test karein:
   - **Login / Signup:** Check karein ki user verify ho raha hai.
   - **Matchmaking Call:** Instant Speaking Partner match ho raha hai ya nahi.
   - **Audio Call:** Dono taraf clear voice ja rahi hai ya nahi.

---

## Phase 10: Automatic Backups aur Security Hardening

Dokploy me aapka data kabhi lose na ho, iske liye 2 minute ka backup setup karein:

1. **Database Backups:**
   - Dokploy me `fluentup-postgres` database me jayein.
   - **Backups** tab me jayein.
   - Schedule set karein: `0 2 * * *` (Har raat 2:00 baje automatic backup).
   - Backup storage local disk ya free Cloudflare R2 / AWS S3 par bhej sakte hain.
2. **Auto-Restart on Crash:**
   - Dokploy me har container by default `restart: unless-stopped` hota hai. Agar VPS reboot bhi ho jaye, to Dokploy, PostgreSQL, Redis aur Backend 10 second me khud-b-khud start ho jate hain.

---

## Troubleshooting & Common Errors

### 1. Error: "Cannot connect to WebSocket / Socket.io failed"
- **Reason:** Reverse proxy me WebSocket headers block ho rahe hain.
- **Solution:** Dokploy me Traefik proxy built-in WebSockets support karta hai. Confirm karein ki mobile app me URL `https://api.yourdomain.com` hai, aur backend ke `.env` me `CORS_ORIGIN=*` set hai.

### 2. Error: "Invalid Private Key for Firebase"
- **Reason:** `.env` me paste karte waqt formatting break ho gayi.
- **Solution:** Private key ko ek hi single line me rakhein jisme sabhi line breaks `\n` ke roop me likhe hon:
  `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBA...-----END PRIVATE KEY-----\n"`

### 3. Error: "DNS probe finished nxdomain" ya Domain Open Nahi Ho Raha
- **Reason:** DNS record update hone me thoda waqt leta hai.
- **Solution:** [https://dnschecker.org](https://dnschecker.org) par jakar `api.yourdomain.com` ka **A Record** check karein. Jab tak wahan aapki VPS IP na dikhe, 10-15 minute wait karein.

### 4. Error: "Port 3000 already in use"
- **Reason:** Dokploy dashboard khud port 3000 use karta hai.
- **Solution:** Dokploy internal container networking use karta hai. Dokploy application me Container Port ko `3000` set karein, bahar VPS par koi port conflict nahi hoga kyunki Traefik proxy use domain name (`api.yourdomain.com`) ke according automatically route kar deta hai.

---

## 🎯 Summary Checklist

- [x] Hostinger se Domain & VPS (KVM 2, Ubuntu 24.04) buy kiya
- [x] DNS A records (`api`, `dokploy`) VPS IP par point kiye
- [x] SSH se VPS login karke `curl -sSL https://dokploy.com/setup.sh | sh` run kiya
- [x] Dokploy web panel par Admin account create kiya
- [x] Dokploy me PostgreSQL aur Redis database 1-click me start kiye
- [x] GitHub repo connect kiya aur `/server` root directory set ki
- [x] `.env` variables paste kiye aur domain `api.yourdomain.com` par SSL lagaya
- [x] `npx prisma db push` run kiya
- [x] Mobile app `fluentUp/constants/config.ts` me naya URL set karke test kiya!

Ab aapka FluentUp backend 100% self-hosted hai, zero dependency ke sath aur pura control aapke haath me hai! 🚀
