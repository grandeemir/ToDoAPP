#!/bin/bash
# Amazon Linux 2023 EC2 User Data Script
# Node.js ToDo Uygulaması ve RDS Bağlantısı Kurulumu

# Çıktıları log dosyasına kaydet
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "Amazon Linux 2023 için kurulum başlatılıyor..."

# Sistemi güncelle
dnf update -y

# Node.js 20, npm ve git kurulumu
dnf install -y nodejs npm git

# Uygulama dizinini oluştur
APP_DIR="/var/www/todoapp"
mkdir -p $APP_DIR

# -------------------------------------------------------------
# NOT: Burada kendi GitHub deponuzdan kodları çekmeniz gerekir
# Örnek: git clone https://github.com/KULLANICI_ADINIZ/todo-app-rds.git $APP_DIR
# Eğer kodları EC2'ye manuel attıysanız/atıyorsanız aşağıdaki adımları kullanabilirsiniz:
# -------------------------------------------------------------

# İlgili dizine git
cd $APP_DIR

# Bağımlılıkları yükle (Eğer kodlar bu dizindeyse)
# npm install

# Yetkilendirme (ec2-user için)
# chown -R ec2-user:ec2-user $APP_DIR

# --- Çevresel Değişkenler (.env) ---
# DİKKAT: EC2'yi ayağa kaldırırken bu kısmı KENDİ RDS BİLGİLERİNİZ ile değiştirin!
# echo "PORT=80" > .env
# echo "DB_HOST=sizin_rds_endpoint_adresiniz" >> .env
# echo "DB_USER=admin" >> .env
# echo "DB_PASSWORD=sifreniz" >> .env
# echo "DB_NAME=tododb" >> .env

# Uygulamayı ayakta tutmak için Systemd servisi oluşturma
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

# Servisi etkinleştir ve başlat
systemctl daemon-reload
systemctl enable todoapp
systemctl start todoapp

echo "Kurulum başarıyla tamamlandı. Uygulama port 80 üzerinde çalışıyor."
