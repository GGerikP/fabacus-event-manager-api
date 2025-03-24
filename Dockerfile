FROM node:18-alpine

# Enable Corepack for Yarn 4+
RUN corepack enable

WORKDIR /app

# 👇 Copy your config file BEFORE install
COPY .yarn ./.yarn
COPY .yarnrc.yml ./
COPY package.json yarn.lock ./

# Install with Yarn 4 using node_modules
RUN yarn install --immutable

# Now copy your source files AFTER deps
COPY . .

# Build the app
RUN yarn build

# Start the app
CMD ["node", "dist/server.js"]
