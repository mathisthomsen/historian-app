# Use the official Node.js 20 LTS image
FROM node:20-alpine

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

# Expose the default Strapi port
EXPOSE 1337

# Start Strapi
CMD ["yarn", "start"]