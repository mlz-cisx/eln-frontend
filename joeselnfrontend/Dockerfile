# Step 1: Build the Angular application
FROM node:22 AS build
WORKDIR /app

# install dependency
COPY package*.json ./
RUN npm install

# copy application code
COPY . .

# set env variables
ARG API_URL
ARG WS_URL
ARG ELN_EXPORTER
ARG KEYCLOAK_URL
ARG KEYCLOAK_REALM
ARG KEYCLOAK_INTEGRATION
ARG KEYCLOAK_CLIENT_ID
ARG NOTE_MAX_SIZE

RUN rm -f src/environments/environment.prod.ts && \
    echo "export const environment = {" > src/environments/environment.prod.ts && \
    echo "  production: false," >> src/environments/environment.prod.ts && \
    echo "  apiUrl: '${API_URL}'," >> src/environments/environment.prod.ts && \
    echo "  wsUrl: '${WS_URL}'," >> src/environments/environment.prod.ts && \
    echo "  tracking: false," >> src/environments/environment.prod.ts && \
    echo "  matomoUrl: null," >> src/environments/environment.prod.ts && \
    echo "  matomoId: null," >> src/environments/environment.prod.ts && \
    echo "  labBookSocketRefreshInterval: 1000," >> src/environments/environment.prod.ts && \
    echo "  eln_exporter: '${ELN_EXPORTER}'," >> src/environments/environment.prod.ts && \
    echo "  keycloak_url: '${KEYCLOAK_URL}'," >> src/environments/environment.prod.ts && \
    echo "  keycloak_clientId: '${KEYCLOAK_CLIENT_ID}'," >> src/environments/environment.prod.ts && \
    echo "  keycloak_integration: ${KEYCLOAK_INTEGRATION}," >> src/environments/environment.prod.ts && \
    echo "  keycloak_realm: '${KEYCLOAK_REALM}'," >> src/environments/environment.prod.ts && \
    echo "  noteMaximumSize: ${NOTE_MAX_SIZE}," >> src/environments/environment.prod.ts && \
    echo "};" >> src/environments/environment.prod.ts

# build angular app
RUN  npx ng build

# Step 2: Serve the application using Nginx
FROM nginx:alpine
COPY --from=build /app/dist/joeselnfrontend13 /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

