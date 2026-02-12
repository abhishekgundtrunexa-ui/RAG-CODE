# Use the base image
FROM node:18

WORKDIR /

# Copy the csms app code
COPY apps/csms/package.json ./
COPY . .

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies specific to csms
RUN pnpm install --filter csms...

# Expose the application port
EXPOSE 3001

# Set the default command
CMD ["pnpm", "--filter", "csms", "start"]
