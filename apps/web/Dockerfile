FROM node:20
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@9 --activate && pnpm install
COPY . .
EXPOSE 3000
# Bind to 0.0.0.0 so it's reachable from the host
CMD ["pnpm","dev","-p","3000","-H","0.0.0.0"]
