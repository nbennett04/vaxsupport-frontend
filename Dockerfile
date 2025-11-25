# Use an official Node.js runtime as a parent image
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js app
RUN npm run build

# Install a lightweight server for production
RUN npm install -g serve

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Use a minimal Node.js image for production
FROM node:18-alpine AS runner

# Set the working directory inside the container
WORKDIR /app

# Copy the production build from the builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose the port Cloud Run will listen on
EXPOSE 3000
ENV PORT 3000
# Define the default command to run the application
CMD ["npm", "start"]
