# Deployment Guide for LuminaShop

## Production Checklist

- [ ] All environment variables configured
- [ ] PostgreSQL database initialized with pgvector
- [ ] Ollama service running and accessible
- [ ] Rate limiting enabled and tuned
- [ ] Error logging configured
- [ ] CORS settings appropriate for production domain
- [ ] Database backups configured
- [ ] Session TTL garbage collection enabled

## Environment Variables

See `.env.example` for all required variables. Critical ones:

```env
DATABASE_URL=postgresql://...
OLLAMA_BASE_URL=http://localhost:11434
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
RATE_LIMIT_MAX_REQUESTS=30
```

## Ollama Setup

### Local Deployment
```bash
ollama pull llama3.2
ollama pull nomic-embed-text
ollama serve
```

### Docker Deployment
```dockerfile
FROM ollama/ollama:latest
RUN ollama pull llama3.2
RUN ollama pull nomic-embed-text
```

## Database Setup (Neon PostgreSQL)

1. Create account at https://neon.tech
2. Create new project
3. Enable pgvector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Get connection string and set `DATABASE_URL`

## Backend Deployment

### Heroku
```bash
heroku create luminashop-backend
heroku config:set DATABASE_URL=postgresql://...
heroku config:set OLLAMA_BASE_URL=http://your-ollama-server:11434
git push heroku main
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/src ./src
COPY backend/prisma ./prisma
RUN npm run build
RUN npm run db:generate
EXPOSE 3001
CMD ["npm", "start"]
```

## Frontend Deployment

### Vercel
```bash
vercel deploy
```

Configure in `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "https://api.yourdomain.com"
  }
}
```

### Netlify
```bash
netlify deploy
```

## Monitoring

- **Health checks**: GET `/health` every 30 seconds
- **Error logging**: Send errors to Sentry or similar
- **Database monitoring**: Monitor connection pool via Neon dashboard
- **Rate limiting**: Track `/api/chat` request patterns

## Troubleshooting

### Database Connection Failed
```bash
# Test connection string
psql $DATABASE_URL

# Verify pgvector extension
psql $DATABASE_URL -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

### Ollama Not Responding
```bash
# Check if service is running
curl http://localhost:11434/api/tags

# Restart service
sudo systemctl restart ollama
```

### High Memory Usage
- Reduce LLM context window
- Implement session cleanup
- Monitor vector embedding process

---

**Need help?** Open an issue on GitHub.
