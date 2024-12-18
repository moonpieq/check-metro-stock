FROM node:21

WORKDIR /usr/src/app

# Install Playwright
RUN npx playwright install-deps chromium
RUN npx playwright install

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy script
COPY index.js .

# Set the entrypoint to the Node.js executable
ENTRYPOINT ["node", "index.js"]

# Default parameters
CMD ["npm", "start"]