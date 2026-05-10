# TaskFlow — AWS 3-Tier Task Manager

A minimal, production-ready Task Manager for demonstrating an AWS 3-Tier architecture:
- **Tier 1 (Web/Presentation):** Static files served by Express (or Nginx)
- **Tier 2 (Application):** Node.js + Express REST API running on EC2
- **Tier 3 (Database):** MySQL on Amazon RDS

---

## 📁 Project Structure

```
taskmanager/
├── app.js              # Express server + API routes
├── package.json
├── .env.example        # Environment variable template
└── public/
    └── index.html      # Single-page frontend
```

---

## 🚀 EC2 Setup

### 1. Launch EC2 Instance
- AMI: Amazon Linux 2023 (or Ubuntu 22.04)
- Instance type: t2.micro (free tier)
- Security Group inbound rules:
  - SSH (22) — your IP
  - HTTP (80) — 0.0.0.0/0
  - Custom TCP (3000) — 0.0.0.0/0  *(or use Nginx to proxy 80 → 3000)*

### 2. SSH into EC2 & Install Node.js
```bash
# Amazon Linux 2023
sudo dnf install -y nodejs npm git

# Ubuntu 22.04
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Clone / Upload Project
```bash
# Option A: git clone
git clone https://github.com/your-repo/taskmanager.git
cd taskmanager

# Option B: SCP from local
scp -r ./taskmanager ec2-user@<EC2-IP>:~/
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Configure Environment
```bash
cp .env.example .env
nano .env      # Fill in your RDS endpoint and credentials
```

### 6. Start the App
```bash
# Development
npm start

# Production (keep alive with PM2)
sudo npm install -g pm2
pm2 start app.js --name taskflow
pm2 startup
pm2 save
```

---

## 🗄️ RDS Setup

### 1. Create RDS Instance
- Engine: MySQL 8.0
- Template: Free tier
- DB instance identifier: `taskdb`
- Master username: `admin`
- Master password: *(your password)*
- Public access: **No** (access only from EC2's Security Group)

### 2. Security Group
- Create/edit RDS Security Group:
  - Inbound: MySQL/Aurora (3306) from **EC2 Security Group ID**

### 3. Create Database
```sql
-- Connect from EC2:
mysql -h <rds-endpoint> -u admin -p

-- Then run:
CREATE DATABASE IF NOT EXISTS taskdb;
```

> The app auto-creates the `tasks` table on first start.

---

## 🔧 Environment Variables

| Variable      | Description                        | Example                              |
|---------------|------------------------------------|--------------------------------------|
| `PORT`        | Server port                        | `3000`                               |
| `DB_HOST`     | RDS endpoint                       | `taskdb.xxxx.us-east-1.rds.amazonaws.com` |
| `DB_USER`     | MySQL username                     | `admin`                              |
| `DB_PASSWORD` | MySQL password                     | `yourpassword`                       |
| `DB_NAME`     | Database name                      | `taskdb`                             |
| `DB_PORT`     | MySQL port                         | `3306`                               |

---

## 📡 API Reference

| Method | Endpoint                  | Description            |
|--------|---------------------------|------------------------|
| GET    | `/api/health`             | DB connection check    |
| GET    | `/api/stats`              | Task count by status   |
| GET    | `/api/tasks`              | List all tasks         |
| GET    | `/api/tasks?status=todo`  | Filter by status       |
| GET    | `/api/tasks/:id`          | Get single task        |
| POST   | `/api/tasks`              | Create task            |
| PUT    | `/api/tasks/:id`          | Update task            |
| PATCH  | `/api/tasks/:id/status`   | Update status only     |
| DELETE | `/api/tasks/:id`          | Delete task            |

---

## ⚡ Optional: Nginx Reverse Proxy (Port 80)

```bash
sudo apt install -y nginx   # Ubuntu
# or
sudo dnf install -y nginx   # Amazon Linux

# /etc/nginx/conf.d/taskflow.conf
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## ✅ Verify It Works

1. Open `http://<EC2-Public-IP>` in browser
2. The header should show **RDS CONNECTED** (green dot)
3. Create, update, and delete tasks — all persisted in MySQL RDS
