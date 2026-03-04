# Contributing to Digi-Pets

Thank you for your interest in contributing to Digi-Pets! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on what's best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected behavior**
- **Actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, Node version, browser)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case** - why would this be useful?
- **Possible implementation** if you have ideas
- **Alternatives considered**

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Follow the coding style** of the project
3. **Write tests** for new features
4. **Update documentation** as needed
5. **Ensure tests pass** before submitting
6. **Write clear commit messages**

## Development Setup

1. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/digi-pets-split.git
cd digi-pets-split
```

2. Install dependencies:
```bash
# Server
cd server
npm install
cp .env.example .env

# Client
cd ../client
npm install --ignore-scripts
cp .env.example .env
```

3. Run tests:
```bash
# Server tests
cd server
npm test

# Client build test
cd ../client
npm run build
```

4. Start development servers:
```bash
# Terminal 1: Server
cd server
npm run dev

# Terminal 2: Client
cd client
npm run dev
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Ensure no TypeScript errors (`npm run build`)
- Use explicit types where helpful
- Avoid `any` type when possible

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in objects/arrays
- Keep functions small and focused
- Use meaningful variable names
- Add comments for complex logic

### Testing

- Write unit tests for new features
- Test edge cases and error conditions
- Maintain or improve code coverage
- Tests should be clear and focused

### Git Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and pull requests

Examples:
```
Add user authentication endpoints
Fix pet stats calculation bug
Update API documentation for new endpoints
```

## Project Structure

```
digi-pets-split/
├── server/              # Backend API
│   ├── src/
│   │   ├── index.ts    # Server entry point
│   │   ├── routes.ts   # API routes
│   │   ├── petService.ts # Business logic
│   │   └── types.ts    # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── client/              # Frontend web app
│   ├── src/
│   │   ├── App.tsx     # Main component
│   │   ├── api.ts      # API client
│   │   └── types.ts    # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── README.md
├── API.md
├── DEPLOYMENT.md
└── SECURITY.md
```

## Feature Development Workflow

1. **Create an issue** describing the feature
2. **Wait for approval** from maintainers
3. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Implement the feature** following coding standards
5. **Write tests** for your feature
6. **Update documentation** if needed
7. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add your feature description"
   ```
8. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
9. **Create a Pull Request** with a clear description

## Pull Request Checklist

Before submitting a pull request, ensure:

- [ ] Code follows project style guidelines
- [ ] All tests pass (`npm test`)
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No TypeScript errors (`npm run build`)
- [ ] No security vulnerabilities introduced
- [ ] Commit messages are clear
- [ ] Branch is up to date with `main`

## Areas for Contribution

Here are some areas where contributions are especially welcome:

### High Priority
- User authentication system
- Database integration (PostgreSQL/MongoDB)
- Pet evolution system
- Achievement system
- Mobile app development (React Native/Capacitor)

### Medium Priority
- Additional pet species
- Battle system
- Trading functionality
- WebSocket support for real-time updates
- Progressive Web App (PWA) features

### Documentation
- Tutorial videos
- API examples in different languages
- Deployment guides for specific platforms
- Translation to other languages

### Testing
- Integration tests
- End-to-end tests
- Performance tests
- Mobile testing

## Questions?

- **General questions**: Open a GitHub Discussion
- **Bug reports**: Open an issue
- **Security issues**: See SECURITY.md

## Recognition

Contributors will be:
- Listed in the project README
- Mentioned in release notes
- Credited in commit messages

Thank you for contributing to Digi-Pets! 🐾
