#!/bin/bash
# Amazon Linux 2023 EC2 User Data Script - FRONTEND ONLY
# Nginx Static File Hosting for ToDo App

exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "Starting Frontend setup for Amazon Linux 2023..."

# Update system
dnf update -y

# Install Nginx and git
dnf install -y nginx git

# Create application directory
APP_DIR="/var/www/todoapp/frontend"
mkdir -p $APP_DIR

# Clone the repository
git clone https://github.com/grandeemir/ToDoAPP.git /tmp/todoapp_repo
cp -r /tmp/todoapp_repo/frontend/* $APP_DIR/
rm -rf /tmp/todoapp_repo

# --- Configuration ---
# IMPORTANT: Before running this, you should update BACKEND_URL in index.html
# Or you can use sed to replace it here:
# sed -i "s|const BACKEND_URL = '';|const BACKEND_URL = 'http://your-backend-ip';|g" $APP_DIR/index.html

# Configure Nginx to serve the frontend
cat <<EOF > /etc/nginx/conf.d/todoapp.conf
server {
    listen 80;
    server_name _;

    location / {
        root $APP_DIR;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# Remove default nginx config if exists
rm -f /etc/nginx/nginx.conf.default

# Enable and start Nginx
systemctl enable nginx
systemctl start nginx

echo "Frontend setup completed successfully. Web interface is running on port 80."
