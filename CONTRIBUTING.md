# Contributing to Religious Gurus

Thank you for considering contributing to Religious Gurus! This document provides guidelines and instructions for contributing to this open source project.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

Before submitting a bug report:
- Check the existing issues to see if the problem has already been reported
- If you're unable to find an open issue addressing the problem, open a new one

When submitting a bug report, please include:
- A clear and descriptive title
- Steps to reproduce the behavior
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Your environment details (OS, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please provide:
- A clear and descriptive title
- A detailed description of the suggested enhancement
- An explanation of why this enhancement would be useful
- Any relevant examples or mockups

### Pull Requests

- Fill in the required template
- Follow the style guides
- Document new code based on the project's documentation style
- Include tests for new features
- End all files with a newline
- Avoid platform-dependent code

## Development Setup

1. Fork the repository
2. Clone your fork to your local machine
3. Install dependencies using `npm install`
4. Set up environment variables (.env file with required API keys)
5. Run the server with `npm run dev`

### Environment Requirements

- Node.js 18+ and npm
- OpenAI API key for model access
- PostgreSQL database for persistent storage

## Project Structure

```
.
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions and API clients
│   │   ├── pages/        # Page components
│   │   └── types/        # TypeScript type definitions
├── server/               # Backend Express.js application
│   ├── chatAgent.ts      # AI agent implementation
│   ├── langGraphAgents.ts # Coordinator agent implementation
│   ├── chartHelper.ts    # Chart data processing utilities
│   ├── routes.ts         # API route definitions
│   └── storage.ts        # Database access layer
└── shared/               # Shared code between client and server
    └── schema.ts         # Database schema and shared types
```

## OpenAI Model Integration

The application uses OpenAI's GPT models (particularly GPT-4o) for generating responses. All AI interactions are handled through the `chatAgent.ts` file, which:

1. Takes user questions
2. Formats prompts for the appropriate worldview
3. Sends requests to the OpenAI API
4. Processes and formats responses

## Adding New Worldviews

To add a new worldview to the system:

1. Add the worldview to the `WorldView` enum in `shared/schema.ts`
2. Add a case in the `createExpertAgent` function in `server/langGraphAgents.ts` with appropriate prompt engineering
3. Add a color and styling for the worldview in the UI components
4. Update tests to include the new worldview

## Style Guide

- Use TypeScript for all JavaScript code
- Follow the ESLint configuration
- Use functional React components with hooks
- Document complex functions with JSDoc comments
- Use shadcn/ui components for UI consistency

## Continuous Integration

All pull requests are automatically tested with our CI/CD pipeline which:
1. Runs unit and integration tests
2. Checks code style with ESLint
3. Validates TypeScript compilation
4. Ensures proper documentation

## License

By contributing to Religious Gurus, you agree that your contributions will be licensed under the project's MIT License.

## Questions?

Feel free to create an issue or contact the maintainers if you have any questions about contributing.

Thank you for contributing to Religious Gurus!