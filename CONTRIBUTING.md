# Contributing to LabManage Research Hub

Thank you for your interest in contributing to the LabManage Research Hub! We welcome contributions from the community.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your feature/fix
4. Make your changes
5. Test your changes thoroughly
6. Submit a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/labmanager.git
cd labmanager

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Set up database
npx prisma generate
npx prisma migrate dev

# Run development server
npm run dev
```

## Code Style

- We use TypeScript for type safety
- Follow the existing code formatting (Prettier is configured)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components small and focused

## Testing

Before submitting a PR, ensure:

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm run test

# Run E2E tests
npm run test:e2e
```

## Commit Messages

We follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test updates
- `chore:` Build/config changes

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Ensure all tests pass
3. Update documentation as needed
4. Request review from maintainers

## Questions?

Feel free to open an issue for any questions or concerns.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.