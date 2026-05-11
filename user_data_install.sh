#!/bin/bash
# Amazon Linux 2023 User Data Script for ToDo App

# 1. Update system packages
dnf update -y

# 2. Install Git and Node.js
# Amazon Linux 2023 comes with Node.js in its default repositories.
dnf install -y git nodejs npm

# 3. Create a directory for the application
APP_DIR="/opt/todoapp"
mkdir -p $APP_DIR

# 4. Clone the repository from GitHub
# Note: Ensure the repository is public or you configure a personal access token (PAT) for private repos.
git clone https://github.com/grandeemir/ToDoAPP.git $APP_DIR

# 5. Navigate to the application directory
cd $APP_DIR

# 6. Install Node.js dependencies
npm install

# 7. Create the .env file for database credentials
# IMPORTANT: In a real production environment, do NOT hardcode credentials here. 
# Instead, fetch them dynamically from AWS Systems Manager Parameter Store or AWS Secrets Manager.
# We are setting PORT=80 so the app can be accessed directly via the instance's Public IP without specifying a port.
cat <<EOF > .env
PORT=80
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=yourpassword
DB_NAME=taskdb
DB_PORT=3306
EOF

# 8. Create a systemd service file to run the app as a background service
# This ensures the app starts automatically when the EC2 instance boots up.
cat <<EOF > /etc/systemd/system/todoapp.service
[Unit]
Description=ToDo Node.js App
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node app.js
Restart=on-failure
# Delay restart to prevent spamming in case of immediate crashes
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 9. Reload systemd to recognize the new service, enable it to start on boot, and start it now
systemctl daemon-reload
systemctl enable todoapp
systemctl start todoapp
