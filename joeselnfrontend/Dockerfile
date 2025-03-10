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
FROM nginx:alpine
COPY --from=build /app/dist/joeselnfrontend13 /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80 443
CMD ["/docker-entrypoint.sh"]

