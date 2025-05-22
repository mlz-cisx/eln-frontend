#!/bin/sh

set -e

SSL_TERMINATION=${SSL_TERMINATION:="false"}

# Load env variables
envsubst < /usr/share/nginx/html/assets/config/env.template.js > /usr/share/nginx/html/assets/config/env.js

# Set server_name if given
if [ -z "$SERVER_NAME" ]; then
    sed -i '/server_name/d' /etc/nginx/conf.d/default.conf
else
    envsubst '$SERVER_NAME' < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf.tmp && mv /etc/nginx/conf.d/default.conf.tmp /etc/nginx/conf.d/default.conf
fi

# forward keycloak
if [ "$KEYCLOAK_BEHIND_NGINX" = "true" ]; then
    echo "Configuring Nginx for Keycloak"
    sed -i '/location \/ {/i \
    location /keycloak/ {\
        proxy_pass http://keycloak:8080;\
        proxy_http_version 1.1;\
        proxy_set_header host \$host;\
        proxy_set_header x-real-ip \$remote_addr;\
        proxy_set_header x-forwarded-for \$proxy_add_x_forwarded_for;\
        proxy_set_header x-forwarded-proto \$scheme;\
    }' /etc/nginx/conf.d/default.conf
fi

# Check if SSL certificates exist
if [ "$SSL_TERMINATION" = "true" ] \
  || { [ -f /etc/nginx/certs/server.crt ] && [ -f /etc/nginx/certs/server.key ] ;} ; then
    echo "SSL certificates found, starting Nginx with HTTPS"
    # inject https-upgrade tag into index.html
    sed -i '/<head>/a<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">' /usr/share/nginx/html/index.html
    nginx -g 'daemon off;'
else
    echo "SSL certificates not found, starting Nginx with HTTP only"
    sed -i '/listen 4430 ssl default_server;/d' /etc/nginx/conf.d/default.conf
    sed -i '/ssl_certificate/d' /etc/nginx/conf.d/default.conf
    sed -i '/ssl_certificate_key/d' /etc/nginx/conf.d/default.conf
    sed -i '/ssl_protocols/d' /etc/nginx/conf.d/default.conf
    sed -i '/ssl_ciphers/d' /etc/nginx/conf.d/default.conf
    sed -i '/ssl_prefer_server_ciphers/d' /etc/nginx/conf.d/default.conf
    nginx -g 'daemon off;'
fi
