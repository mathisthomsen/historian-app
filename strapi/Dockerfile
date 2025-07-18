# Use the official Node.js 20 LTS image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /opt/app

# Copy package.json and yarn.lock first for better build caching
COPY package.json yarn.lock ./

# Install dependencies (including devDependencies for TypeScript)
RUN yarn install --frozen-lockfile --production=false

# Copy the rest of the Strapi project files
COPY . .

# Ensure TypeScript types are properly installed
RUN yarn add @types/minimatch@^6.0.0

# Build the Strapi admin panel
RUN yarn build

# Production stage
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /opt/app

# Copy package files
COPY package.json yarn.lock ./

# Install all dependencies (not just production) for dev mode
RUN yarn install --frozen-lockfile --production=false

# Copy built application from builder stage
COPY --from=builder /opt/app/public ./public
COPY --from=builder /opt/app/src ./src
COPY --from=builder /opt/app/config ./config
COPY --from=builder /opt/app/database ./database
COPY --from=builder /opt/app/dist ./dist

# Copy admin build files to the expected location
RUN mkdir -p /opt/app/node_modules/@strapi/admin/dist/server/server/build
COPY --from=builder /opt/app/dist/build/* /opt/app/node_modules/@strapi/admin/dist/server/server/build/

# Expose the default Strapi port
EXPOSE 1337

# Start Strapi
CMD ["yarn", "start"]