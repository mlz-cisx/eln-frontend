# Step 1: Build the Angular application
FROM node:22 AS build
WORKDIR /app

# install dependency
COPY package*.json ./
RUN npm install

# copy application code
COPY . .

# build angular app
RUN  npx ng build

# Step 2: Serve the application using Nginx
FROM docker.io/nginxinc/nginx-unprivileged:1.26.3
USER root
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
COPY --from=build --chown=101:0 /app/dist/joeselnfrontend13/browser /usr/share/nginx/html
USER 101
EXPOSE 8080 4430
ENTRYPOINT ["/docker-entrypoint.sh"]
