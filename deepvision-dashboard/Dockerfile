# Stage 1 — build the React app
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Empty string tells the app to use same-origin (via Nginx proxy)
ARG VITE_REALTIME_URL=""
ENV VITE_REALTIME_URL=${VITE_REALTIME_URL}

RUN npm run build

# Stage 2 — serve with Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
