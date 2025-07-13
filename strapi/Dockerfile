# Use the official Node.js 20 LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /opt/app

# Copy package.json and yarn.lock first for better build caching
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the Strapi project files
COPY . .

# Build the Strapi admin panel
RUN yarn build

# Expose the default Strapi port
EXPOSE 1337

# Start Strapi
CMD ["yarn", "start"]