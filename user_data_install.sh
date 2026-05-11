#!/bin/bash
# Optimized Amazon Linux 2023 User Data Script for ToDo App

# 1. Update system packages
dnf update -y

# 2. Install required packages: Git, Node.js, and Nginx (Reverse Proxy)
dnf install -y git nodejs npm nginx

# 3. Create a dedicated, non-root user for security (Least Privilege Principle)
useradd -m -s /bin/bash todouser

# 4. Create application directory
APP_DIR="/opt/todoapp"
mkdir -p $APP_DIR

# 5. Clone the repository
git clone https://github.com/grandeemir/ToDoAPP.git $APP_DIR
chown -R todouser:todouser $APP_DIR

# 6. Install Node.js dependencies as the dedicated user
cd $APP_DIR
sudo -u todouser npm install

# 7. Create the .env file
# (Replace placeholders with your actual RDS credentials)
# We set PORT=3000, Nginx will proxy traffic from port 80 to 3000
cat <<EOF > $APP_DIR/.env
PORT=3000
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=yourpassword
DB_NAME=taskdb
DB_PORT=3306
EOF
chown todouser:todouser $APP_DIR/.env

# 8. Install PM2 (Process Manager for Node.js) globally
npm install -g pm2

# 9. Start the Node.js application with PM2 as the non-root user
sudo -u todouser pm2 start app.js --name "todoapp"

# 10. Generate systemd startup script for PM2 so the app starts on boot
pm2 startup systemd -u todouser --hp /home/todouser
sudo -u todouser pm2 save

# 11. Configure Nginx as a Reverse Proxy
# Using single quotes 'EOF' prevents bash from evaluating variables like $http_upgrade
cat <<'EOF' > /etc/nginx/conf.d/todoapp.conf
server {
    listen 80;
    server_name _;

    # Proxy all HTTP traffic to the Node.js app running on port 3000
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 12. Enable and start Nginx service
systemctl enable nginx
systemctl start nginx
