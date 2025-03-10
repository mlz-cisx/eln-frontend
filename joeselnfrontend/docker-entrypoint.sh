#!/bin/sh

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
