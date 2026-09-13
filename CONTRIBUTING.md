# Contributing to LuminaShop

Thank you for your interest in contributing to LuminaShop! This guide will help you get started.

## Getting Started

### Prerequisites

- **Node.js** 20+ (https://nodejs.org/)
- **Ollama** (https://ollama.ai) - for running local LLMs
- **PostgreSQL** with pgvector (https://neon.tech for free tier)

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/itzAnshDahiya/LuminaShop.git
   cd LuminaShop
   ```

2. **Install Ollama models**
   ```bash
   ollama pull llama3.2
   ollama pull nomic-embed-text
   ollama serve  # Keep this running in another terminal
   ```

3. **Backend setup**
   ```bash
   cd backend
   npm install
   cp ../.env.example .env
   # Edit .env with your Neon PostgreSQL URL
   npm run db:generate
   npm run db:migrate
   npm run db:seed  # Generates embeddings (~2 min)
   npm run dev
   ```

4. **Frontend setup** (in another terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Visit `http://localhost:5173` to test the app.

## Code Style & Standards

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier (2-space indents)
- **Linting**: ESLint
- **Naming**: camelCase for variables/functions, PascalCase for classes/components

### Before Submitting a PR

1. **Type check**
   ```bash
   cd backend && npm run build
   cd ../frontend && npm run build
   ```

2. **Test your changes**
   - Manual testing: Send messages through the chat interface
   - Check browser console for errors
   - Verify database updates in Neon dashboard

3. **Add JSDoc comments** to new functions
   ```typescript
   /**
    * Fetch products by category
    * @param category - Product category string
    * @returns Array of products or empty array
    * @throws Will log error but not crash
    */
   ```

## Areas for Contribution

### High Impact 🔥
- [ ] Unit tests for agent nodes
- [ ] E2E tests for chat flow
- [ ] Negotiation agent improvements
- [ ] Better error messages
- [ ] Rate limiting configuration

### Medium Impact 🚀
- [ ] Frontend accessibility (ARIA labels)
- [ ] Loading/error states for API calls
- [ ] Product image optimization
- [ ] Cart persistence to localStorage
- [ ] Dark/light mode toggle

### Good First Issues ✨
- [ ] Add missing JSDoc comments
- [ ] Improve README with screenshots
- [ ] Create API documentation (Swagger/OpenAPI)
- [ ] Add example `.env` values
- [ ] Create GitHub issue templates

## Bug Reports

When reporting bugs, include:
1. **Description**: Clear summary of the issue
2. **Steps to reproduce**: Exact sequence to trigger the bug
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Environment**: Node version, OS, browser (for frontend bugs)
6. **Logs**: Any error messages or stack traces

## Pull Request Process

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/your-feature-name`
3. **Commit changes**: `git commit -m "feat: describe what you changed"`
4. **Push to your fork**: `git push origin feature/your-feature-name`
5. **Open a PR** against `main` branch
6. **Link related issues** in PR description
7. **Wait for review** - maintainers will provide feedback

### PR Title Format

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Test additions
- `chore:` - Maintenance

Example: `feat: add price negotiation validation`

## Questions?

Open an issue or start a discussion in the repository. We're here to help!

---

**Happy coding! 🚀**
