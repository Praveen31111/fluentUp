# 🚀 FluentUp - Oracle Cloud Always Free VPS Migration & Setup Guide

Yeh document FluentUp backend ko **Render (Free Tier)** se **Oracle Cloud (Always Free VPS)** par shift karne ka full step-by-step master guide hai.

---

## 📑 Progress Tracker (Checklist)

- [ ] **Stage 1:** Oracle Cloud Free Tier Account Setup
- [ ] **Stage 2:** Virtual Machine (Compute Instance) Creation & SSH Key Download
- [ ] **Stage 3:** Oracle VCN & Subnet Firewall Ports Configuration (80, 443, 3000)
- [ ] **Stage 4:** SSH Login from Windows Terminal
- [ ] **Stage 5:** Server Environment Setup (Ubuntu Firewall, Node.js 20, Redis, Nginx, PM2)
- [ ] **Stage 6:** FluentUp Backend Deployment (.env, Prisma, Build)
- [ ] **Stage 7:** PM2 Process Manager & 24/7 Background Running
- [ ] **Stage 8:** Domain & Nginx Reverse Proxy with Free SSL (HTTPS & WSS)
- [ ] **Stage 9:** Mobile App API URL Update & Final Testing

---

## 🟢 STAGE 1: Oracle Cloud Account Setup

### Step 1.1: Sign-up Page Par Jaayein
1. Apne browser me open karein: **[https://www.oracle.com/cloud/free/](https://www.oracle.com/cloud/free/)**
2. **"Start for free"** button par click karein.

### Step 1.2: Account Details Fill Karein
1. **Country/Territory:** `India` select karein.
2. **First Name & Last Name:** Apna exact legal name dalein (jo bank card par ho).
3. **Email:** Apna active email address dalein aur verify karein.

### Step 1.3: Account Type & Home Region (⚠️ Most Critical)
1. **Account Type:** `Individual` choose karein.
2. **Cloud Account Name:** Ek unique name dalein (jaise: `fluentup-cloud`).
3. **Home Region:** 
   - Choose karein: **India West (Mumbai)** ya **India South (Hyderabad)**.
   - *Dhyan rahe:* Home Region baad me change nahi hota. Indian users ke liye Mumbai/Hyderabad sabse kam latency (fastest ping) dega.

### Step 1.4: Payment Verification Card
- Oracle verification ke liye ek **International Debit/Credit Card (Visa / Mastercard)** maangta hai.
- Card enter karne par bank se lagbhag ₹80 se ₹100 ka temporary test charge katega aur turant 10-15 minute me wapas refund ho jayega.
- **Always Free Tier me aapse koi monthly charges nahi liye jayenge jab tak aap explicitly upgrade na karein.**

### Step 1.5: Account Activation
- Signup complete hone ke baad 5 se 15 minute me email aayega: *"Your Oracle Cloud account is ready"*.
- Fir aap [cloud.oracle.com](https://cloud.oracle.com) par sign in kar sakte hain.

---

## 🟢 STAGE 2: Virtual Machine (Compute Instance) Create Karna

Jab Oracle Cloud Dashboard open ho jaye:

1. Top-left corner me **Navigation Menu (☰ 3 lines)** par click karein.
2. **Compute** > **Instances** par click karein.
3. Blue color ka button hoga: **Create instance** — uspe click karein.

### Configuration Settings:
- **Name:** `fluentup-backend`
- **Compartment:** Default rehne dein.
- **Placement:** Default (Availability Domain AD-1).

#### Image and Shape (Click "Edit"):
- **Image:** Click on **Change image** > **Canonical Ubuntu** > Select **Ubuntu 22.04** ya **Ubuntu 24.04 Minimal/Standard**.
- **Shape:** Click on **Change shape** > Select **Ampere (ARM Processor)**:
  - Select `VM.Standard.A1.Flex`
  - **OCPU slider:** 2 ya 4 OCPUs
  - **Memory slider:** 12 GB ya 24 GB RAM (Always Free me up to 4 OCPU aur 24 GB RAM free milti hai).
  *(Note: Agar Ampere "Out of capacity" bole, toh AMD "VM.Standard.E2.1.Micro" 1GB choose kar sakte hain).*

#### Networking:
- **Virtual cloud network:** Create new virtual cloud network (Default).
- **Public Subnet:** Create new public subnet (Default).
- **Assign a public IPv4 address:** **YES** (Tick hona chahiye).

#### Add SSH Keys (⚠️ Sabse Zaroori Step):
- Select **"Generate SSH key pair"**.
- Click karein **"Save private key"** (.key / .pem download hoga).
- Is key file ko apne computer me safe jagah save karein:
  - Example: `C:\Users\pc\.ssh\oracle_key.key`

4. Bottom me **"Create"** button dabayein.
5. 1-2 minute me instance ka icon **Orange (PROVISIONING)** se **Green (RUNNING)** ho jayega.
6. Screen par aayi **Public IP Address** (e.g. `140.238.xxx.xxx`) ko copy kar lein.

---

## 🟢 STAGE 3: Oracle VCN & Subnet Firewall Rules

Agar ye nahi karenge toh mobile app ya browser aapke server se connect nahi ho payega.

1. Instance page par niche scroll karein aur **Primary VNIC** ke under **Subnet: ...** link par click karein.
2. Left side me **Security Lists** tab par click karein > **Default Security List for...** par click karein.
3. **Add Ingress Rules** button dabayein:
   - **Source Type:** `CIDR`
   - **Source CIDR:** `0.0.0.0/0`
   - **IP Protocol:** `TCP`
   - **Destination Port Range:** `80,443,3000`
   - **Description:** `HTTP, HTTPS, NestJS App`
4. Click **Add Ingress Rules**.

---

## 🟢 STAGE 4: Apne Laptop Se Server Me SSH Login

1. Apne Windows PC me **PowerShell** kholein.
2. File permissions secure karein (agar required ho):
   ```powershell
   icacls "C:\Users\pc\.ssh\oracle_key.key" /inheritance:r
   icacls "C:\Users\pc\.ssh\oracle_key.key" /grant:r "$($env:USERNAME):(R)"
   ```
3. Server me login karein:
   ```powershell
   ssh -i "C:\Users\pc\.ssh\oracle_key.key" ubuntu@<YOUR_ORACLE_PUBLIC_IP>
   ```
4. Terminal par `Are you sure you want to continue connecting (yes/no)?` aayega, `yes` type karke Enter dabayein.
5. Ab aapke samne `ubuntu@fluentup-backend:~$` prompt aayega.

---

## 🟢 STAGE 5: Server Environment Setup

Ubuntu terminal ke andar ye commands run karein:

### 5.1 System Update:
```bash
sudo apt update && sudo apt upgrade -y
```

### 5.2 Ubuntu Internal Firewall Allow (Oracle images me iptables locked rehta hai):
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

### 5.3 Software Packages Install:
```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx redis-server

# PM2 Process Manager
sudo npm install -g pm2
```

### 5.4 Redis Test:
```bash
sudo systemctl enable redis-server
sudo systemctl start redis-server
redis-cli ping
# Output aana chahiye: PONG
```

---

## 🟢 STAGE 6: FluentUp Backend Deploy Karna

### 6.1 Code Server me layein:
```bash
cd /home/ubuntu
git clone https://github.com/Praveen31111/fluentUp.git app
cd app/server
```

### 6.2 Packages install karein:
```bash
npm install
```

### 6.3 `.env` File banayein:
```bash
nano .env
```
Niche diya gaya content paste karein (Apni actual Database URL & Firebase credentials ke saath):
```env
PORT=3000
NODE_ENV=production

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://username:password@ep-cool-forest.us-east-2.aws.neon.tech/fluentup?sslmode=require"

# VPS Local Redis (Fast matchmaking queue)
REDIS_HOST="127.0.0.1"
REDIS_PORT=6379
REDIS_PASSWORD=""

# Firebase Admin
FIREBASE_PROJECT_ID="fluentup-app"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@fluentup-app.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Security & CORS
CORS_ORIGIN="*"

# WebRTC STUN/TURN
TURN_URLS="turn:openrelay.metered.ca:80,turn:openrelay.metered.ca:443"
TURN_USERNAME="openrelay"
TURN_CREDENTIAL="openrelay"
```
*Save karne ke liye:* `Ctrl + O` fir `Enter`, fir `Ctrl + X`.

### 6.4 Prisma & NestJS Build:
```bash
npx prisma generate
npx prisma migrate deploy
npm run build
```

---

## 🟢 STAGE 7: PM2 Se 24/7 Run Karna

```bash
# Server ko background me start karein
pm2 start dist/src/main.js --name "fluentup-server"

# Auto-start on system reboot configure karein
pm2 startup
# Terminal par aayi hui 'sudo env PATH=...' command ko copy karke run karein
pm2 save

# Status aur logs check karne ke liye:
pm2 status
pm2 logs fluentup-server
```

---

## 🟢 STAGE 8: Domain, Nginx Reverse Proxy & Free SSL (HTTPS & WSS)

### 8.1 Nginx Site Configuration:
```bash
sudo nano /etc/nginx/sites-available/fluentup
```

Paste karein:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com; # Apna domain ya subdomain dalein

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # WebSocket headers for Socket.IO matchmaking
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Enable karein:
```bash
sudo ln -s /etc/nginx/sites-available/fluentup /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 8.2 Free SSL Certificate (Certbot):
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## 🟢 STAGE 9: Mobile App me Naya URL Update Karna

`fluentUp` mobile app codebase me Render ka URL replace karein:
- **Old URL:** `https://fluentup-server.onrender.com`
- **New URL:** `https://api.yourdomain.com` (ya direct testing ke liye `http://<YOUR_ORACLE_PUBLIC_IP>:3000`)

Test karein:
1. User Login / Firebase token verification
2. Real-time Matchmaking queue (Socket.io)
3. 1-on-1 Audio/Video Call STUN/TURN connection
