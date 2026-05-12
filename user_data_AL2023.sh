#!/bin/bash
# Amazon Linux 2023 EC2 User Data Script
# Node.js ToDo App and RDS Connection Setup

# Save outputs to a log file
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "Starting setup for Amazon Linux 2023..."

# Update system
dnf update -y

# Install Node.js 20, npm and git
dnf install -y nodejs npm git

# Create application directory
APP_DIR="/var/www/todoapp"
mkdir -p $APP_DIR

# -------------------------------------------------------------
# NOTE: You should clone your code from your GitHub repository here
# Example: git clone https://github.com/YOUR_USERNAME/todo-app-rds.git $APP_DIR
# If you pushed codes to EC2 manually, you can use the steps below:
# -------------------------------------------------------------

# Go to the application directory
cd $APP_DIR

# Install dependencies (If codes are in this directory)
# npm install

# Set permissions (for ec2-user)
# chown -R ec2-user:ec2-user $APP_DIR

# --- Environment Variables (.env) ---
# WARNING: Replace this part with YOUR OWN RDS CREDENTIALS when launching EC2!
# echo "PORT=80" > .env
# echo "DB_HOST=your_rds_endpoint_address" >> .env
# echo "DB_USER=admin" >> .env
# echo "DB_PASSWORD=your_password" >> .env
# echo "DB_NAME=tododb" >> .env

# Create Systemd service to keep the application running
cat <<EOF > /etc/systemd/system/todoapp.service
[Unit]
Description=Node.js ToDo App with RDS
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
systemctl enable todoapp
systemctl start todoapp

echo "Setup completed successfully. Application is running on port 80."
