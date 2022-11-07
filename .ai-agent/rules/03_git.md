# Git and Version Control Guidelines

## GitHub Flow Branching Strategy

- **Main Branch**: `main` - Contains production-ready code
- **Feature Branches**: `feature/[feature-name]` - For new features
- **Bugfix Branches**: `bugfix/[issue-id]` - For bug fixes
- **Hotfix Branches**: `hotfix/[issue-id]` - For urgent fixes

**Important Rules**:

- No direct commits or merges to the `main` branch
- All changes must be made through GitHub Pull Requests
- Pull Requests must be reviewed and approved by the user before merging

## Commit Guidelines

### Commit Message Format

```text
[type]: [concise description]

[detailed description (optional)]

[references (optional)]
```

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting changes
- `refactor`: Code refactoring without functionality change
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks, dependencies, etc.

### Commit Best Practices

- Make small, focused commits
- Write clear, descriptive commit messages
- Reference issues or tickets when applicable
- Ensure each commit leaves the codebase in a working state
- Separate refactoring commits from feature/fix commits

## Pull Request Process

1. Create feature/bugfix branch from `main`
2. Implement changes with proper tests
3. Ensure all tests pass
4. Create pull request with:
   - Clear description of changes
   - Reference to related issues
   - Test results
   - Any deployment considerations
5. Wait for user review
6. Address review feedback thoroughly:
   - Respond to all comments on the PR
   - Make requested code changes
   - Push updates to the same branch
   - Continue discussion in the PR until all issues are resolved
7. User will approve and merge the PR when satisfied
8. After the PR is merged, clean up branches:
   - Update local main branch
   - Delete the local feature branch
   - Delete the remote feature branch

## Code Review Guidelines

- Review code for:
  - Functionality
  - Security
  - Performance
  - Maintainability
  - Adherence to project patterns
  - Test coverage
- Provide constructive feedback
- Use inline comments for specific issues

## GitHub Flow Workflow

### Starting New Work

Use MCP Git tools:

```bash
mcp__git__git_checkout main
mcp__git__git_pull
mcp__git__git_create_branch feature/[feature-name]
mcp__git__git_checkout feature/[feature-name]
```

### Regular Commits

Use MCP Git tools:

```bash
mcp__git__git_add [files]
mcp__git__git_commit "type: descriptive message"
```

### Creating Pull Request

Use MCP tools:

```bash
git push -u origin feature/[feature-name]  # Standard push
mcp__github__create_pull_request          # Create PR via MCP
```

### Responding to PR Feedback

1. Make requested changes locally
2. Commit and push to the feature branch
3. Respond to comments on GitHub PR
4. Document all discussions in the PR for future reference

### After PR is Merged by User

Use MCP Git tools:

```bash
mcp__git__git_checkout main
mcp__git__git_pull
mcp__git__git_branch -d feature/[feature-name]
mcp__github__delete_branch feature/[feature-name]
```

## Development Phase Management

### End of Phase Tasks

At the end of each development phase, the following tasks must be completed in order:

#### 1. Quality Assurance

Execute all quality checks using pnpm:

```bash
pnpm run typecheck
pnpm run lint
pnpm run format
pnpm test
```

All checks must pass before proceeding to the next steps.

#### 2. Memory File Updates

Update project memory files to reflect current status:

- `.ai-agent/memory/activeContext.md` - Current project focus and status
- `.ai-agent/memory/progress.md` - Progress tracking and milestone updates
- Other memory files as needed based on the phase content

#### 3. Git Operations

Use MCP Git tools following GitHub Flow Workflow (see above sections)

#### 4. Pull Request Creation and Review

- Create PR using `mcp__github__create_pull_request`
- Include comprehensive description with:
  - Summary of changes
  - Test results
  - Any relevant context
- Request user review
- Wait for approval and merge (see "After PR is Merged" section for cleanup)

### Package Management with pnpm

This project uses pnpm for package management. Always use pnpm commands:

- **Install dependencies**: `pnpm install`
- **Add package**: `pnpm add [package]`
- **Add dev dependency**: `pnpm add -D [package]`
- **Remove package**: `pnpm remove [package]`
- **Run scripts**: `pnpm run [script-name]`

## GitHub Integration

- Link commits to issues using keywords (Fixes #123, Closes #456)
- Use GitHub Actions for CI/CD when configured
- Protect branches with appropriate rules
- Use GitHub Projects for task tracking when applicable

## MCP Server Integration

- **Primary Tools**: Always use `mcp__git` and `mcp__github` tools for Git and GitHub operations
- **Fallback Approach**: Only use standard Git commands when MCP tools are unavailable or return errors
- **Error Handling**: If MCP tools return errors, document the issue and fall back to shell commands
