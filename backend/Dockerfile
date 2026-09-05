FROM node:20-alpine

WORKDIR /app

# Copy only manifest files first — this layer only rebuilds when deps change,
# not on every source code edit (Docker layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Now copy source code
COPY src ./src

# Create a non-root user and switch to it
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000

CMD ["node", "src/server.js"]