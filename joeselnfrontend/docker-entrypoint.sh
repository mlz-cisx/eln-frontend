#!/bin/sh

# Load env variables
envsubst < /usr/share/nginx/html/assets/config/env.template.js > /usr/share/nginx/html/assets/config/env.js

# Set server_name if given
if [ -z "$SERVER_NAME" ]; then
    sed -i '/server_name/d' /etc/nginx/conf.d/default.conf
else
    envsubst '$SERVER_NAME' < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf.tmp && mv /etc/nginx/conf.d/default.conf.tmp /etc/nginx/conf.d/default.conf
fi

# Check if SSL certificates exist
if [ -f /etc/nginx/certs/server.crt ] && [ -f /etc/nginx/certs/server.key ]; then
    echo "SSL certificates found, starting Nginx with HTTPS"
    nginx -g 'daemon off;'
else
    echo "SSL certificates not found, starting Nginx with HTTP only"
    sed -i '/listen 443 ssl default_server;/d' /etc/nginx/conf.d/default.conf
    sed -i '/ssl_certificate/d' /etc/nginx/conf.d/default.conf
    sed -i '/ssl_certificate_key/d' /etc/nginx/conf.d/default.conf
    sed -i '/ssl_protocols/d' /etc/nginx/conf.d/default.conf
    sed -i '/ssl_ciphers/d' /etc/nginx/conf.d/default.conf
    sed -i '/ssl_prefer_server_ciphers/d' /etc/nginx/conf.d/default.conf
    nginx -g 'daemon off;'
fi
