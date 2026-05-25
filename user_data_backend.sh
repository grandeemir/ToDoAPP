#!/bin/bash
# Amazon Linux 2023 EC2 User Data Script - BACKEND ONLY
# Node.js ToDo App Backend Setup

exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "Starting Backend setup for Amazon Linux 2023..."

# Update system
dnf update -y

# Install Node.js 20, npm and git
dnf install -y nodejs npm git

# Create application directory
APP_DIR="/var/www/todoapp/backend"
mkdir -p $APP_DIR

# Clone the repository
git clone https://github.com/grandeemir/ToDoAPP.git /tmp/todoapp_repo
cp -r /tmp/todoapp_repo/backend/* $APP_DIR/
rm -rf /tmp/todoapp_repo

cd $APP_DIR

# Install dependencies
npm install

# --- Environment Variables (.env) ---
# WARNING: Replace this part with YOUR OWN RDS CREDENTIALS when launching EC2!
# cat <<EOF > .env
# PORT=80
# DB_HOST=your_rds_endpoint_address
# DB_USER=admin
# DB_PASSWORD=your_password
# DB_NAME=tododb
# EOF

# Create Systemd service
cat <<EOF > /etc/systemd/system/todo-backend.service
[Unit]
Description=Node.js ToDo App Backend
After=network.target

[Service]
Environment=NODE_PORT=80
Type=simple
User=root
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
systemctl daemon-reload
systemctl enable todo-backend
systemctl start todo-backend

echo "Backend setup completed successfully. API is running on port 80."
