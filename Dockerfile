# lamb — der laufende Server.
#
# Keine Abhängigkeiten, kein Build: Node bringt SQLite selbst mit. Deshalb ist
# das Abbild klein und der Start sofort.
FROM node:22-alpine

WORKDIR /app
COPY package.json ./
COPY src ./src

# Die Datenbank liegt in einem Volume, damit sie einen Neustart überlebt.
ENV LAMB_DB=/data/lamb.db
ENV LAMB_PORT=8080
VOLUME /data
EXPOSE 8080

# LAMB_ORIGIN muss beim Start auf die öffentliche Adresse zeigen — daraus werden
# die ActivityPub-Kennungen gebildet, und die müssen stimmen, sonst kann kein
# anderer Server antworten.
CMD ["node", "--experimental-sqlite", "src/server.js"]
