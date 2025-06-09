FROM node:18-bullseye

# Install Expo CLI globally
RUN npm install -g expo-cli

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project
COPY . .

# Expose ports used by Expo
EXPOSE 8081 19000 19001 19002 19006

# Default command to start the Expo server
CMD ["npx", "expo", "start", "--tunnel", "--no-dev"]
