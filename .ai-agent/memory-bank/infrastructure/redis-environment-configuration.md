# Redis Environment Configuration Plan

## Overview

This document outlines the comprehensive Redis configuration strategy for the Kanadle5 Game across all development, testing, and production environments. The strategy uses Serverless Redis HTTP (SRH) for local development and Upstash Cloud for production, providing Upstash-compatible REST API interface throughout all environments, ensuring complete code consistency while maintaining appropriate environment isolation.

## Environment Architecture

### Environment Matrix

| Environment           | Type         | Redis Connection              | Database | Purpose                         |
| --------------------- | ------------ | ----------------------------- | -------- | ------------------------------- |
| **Local Development** | devcontainer | Serverless Redis HTTP (SRH)   | -        | Feature development & debugging |
| **Local Test**        | devcontainer | Serverless Redis HTTP (SRH)   | -        | Unit & Integration testing      |
| **GitHub Actions**    | CI/CD        | Serverless Redis HTTP (SRH)   | -        | Automated testing               |
| **Vercel Production** | Production   | Upstash Cloud `kanadle5-game` | -        | Live application                |
| **Vercel Preview**    | Staging      | Upstash Cloud `kanadle5-game` | -        | PR previews & testing           |

### Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│                     Redis Environment Setup                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  LOCAL ENVIRONMENTS (devcontainer)                          │
│  ┌─────────────────────────────────────────┐               │
│  │  Serverless Redis HTTP (SRH)           │               │
│  │  ├─ Development Environment              │               │
│  │  └─ Test Environment (isolated)         │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  CI/CD ENVIRONMENT                                          │
│  ┌─────────────────────────────────────────┐               │
│  │  GitHub Actions                          │               │
│  │  └─ Serverless Redis HTTP (SRH)        │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  CLOUD ENVIRONMENTS                                         │
│  ┌─────────────────────────────────────────┐               │
│  │  Upstash Cloud                          │               │
│  │  └─ Production & Preview:               │               │
│  │     kanadle5-game database              │               │
│  └─────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## Configuration Details

### 1. Local Development Environment

**Configuration File**: `.env.development.local`

```bash
# Redis Configuration for Local Development
KV_REST_API_URL=http://localhost:8079
KV_REST_API_TOKEN=local-dev-token

# Other development configs
NEXT_PUBLIC_LIFF_ID=dev-liff-id
DAILY_WORD_REFRESH_TIME=00:00:00
```

**Docker Compose Service**:

```yaml
upstash-redis:
  image: hiett/serverless-redis-http:latest
  ports:
    - '8079:80'
  environment:
    - SRH_MODE=env
    - SRH_TOKEN=local-dev-token
    - SRH_CONNECTION_STRING=redis://redis:6379
```

**Purpose**:

- Feature development
- Real-time debugging
- Browser-based testing
- Complete offline development

### 2. Local Test Environment

**Configuration File**: `.env.test.local`

```bash
# Redis Configuration for Local Testing
KV_REST_API_URL=http://localhost:8079
KV_REST_API_TOKEN=local-test-token

# Test-specific configs
NODE_ENV=test
```

**Test Isolation Strategy**:

- Use key prefixes for test isolation (e.g., `test:*`)
- Clear test data before/after test runs
- Separate test instance if needed via different port

**Purpose**:

- Unit tests (with mocks)
- Integration tests (with real Redis)
- Isolated test data
- Fast test execution

### 3. GitHub Actions Environment

**Configuration**: `.github/workflows/ci.yml`

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - 6379:6379
    options: >-
      --health-cmd "redis-cli ping"
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5

  upstash-redis:
    image: hiett/serverless-redis-http:latest
    ports:
      - 8079:80
    env:
      SRH_MODE: env
      SRH_TOKEN: github-actions-token
      SRH_CONNECTION_STRING: redis://redis:6379
    options: >-
      --health-cmd "curl -f http://localhost:80/ || exit 1"
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5

env:
  KV_REST_API_URL: http://localhost:8079
  KV_REST_API_TOKEN: github-actions-token
```

**Purpose**:

- Automated CI/CD testing
- Pull request validation
- Pre-merge checks
- Consistent test environment

### 4. Vercel Production Environment

**Database**: Upstash Cloud - `kanadle5-game`

**Configuration**:

- Managed through Vercel Dashboard
- Environment variables automatically injected
- Connected to Production deployments

**Environment Variables** (set in Vercel):

```bash
KV_REST_API_URL=[Upstash REST URL]
KV_REST_API_TOKEN=[Upstash REST Token]
```

**Purpose**:

- Live application hosting
- Production data persistence
- High availability and performance

### 5. Vercel Preview Environment

**Database**: Upstash Cloud - `kanadle5-game` (shared with production)

**Configuration**:

- Uses the same Upstash instance as production
- Suitable for limited-access environments
- Environment variables inherited from production settings

**Data Isolation**:

- Consider using key prefixes for preview deployments
- Example: `preview:{deployment-id}:*`

**Purpose**:

- Pull request previews
- Pre-production testing
- Feature validation

## Testing Strategy

### Unit Tests

- **Scope**: Individual functions and components
- **Redis**: Mocked using Jest
- **Execution**: Every commit
- **Example**: `validateWord.test.ts`

### Integration Tests

- **Scope**: System component interactions
- **Redis**: Real connection to Upstash REST server
- **Execution**: Important changes, pre-merge
- **Example**: `getDailyWord.integration.test.ts`

### Test Organization

```text
src/
├── lib/
│   ├── game/
│   │   ├── validateWord.test.ts        # Unit test (mock)
│   │   └── validateWord.integration.test.ts  # Integration test (real Redis)
│   └── redis.test.ts                    # Unit test (mock)
└── __tests__/
    └── integration/
        └── daily-word-system.test.ts   # Full system integration test
```

## Implementation Checklist

### User Actions Required

1. **Verify Upstash Cloud Configuration**

   - [ ] Confirm Upstash database is created and accessible
   - [ ] Obtain REST API URL and token from Upstash console
   - [ ] Configure Vercel environment variables

2. **Local Development Setup**
   - [ ] Install Docker Desktop (if not already installed)
   - [ ] Copy `.env.development.local.example` to `.env.development.local`
   - [ ] Copy `.env.test.local.example` to `.env.test.local`

### Development Team Actions

1. **devcontainer Configuration**

   - [ ] Create `.devcontainer/docker-compose.yml` with Upstash REST server
   - [ ] Update `.devcontainer/devcontainer.json`
   - [ ] Add health check configuration

2. **Environment Files**

   - [ ] Create `.env.development.local.example` template
   - [ ] Create `.env.test.local.example` template
   - [ ] Update `.env.local.example` with production template

3. **Redis Connection Module**

   - [ ] Keep `src/lib/redis.ts` simple (no environment-specific logic needed)
   - [ ] Use same Upstash client for all environments
   - [ ] Add connection validation helper

4. **CI/CD Updates**

   - [ ] Update `.github/workflows/ci.yml` with Upstash REST server
   - [ ] Configure health checks for services
   - [ ] Set environment variables for tests

5. **Test Infrastructure**
   - [ ] Configure Jest for integration tests
   - [ ] Create test data cleanup utilities
   - [ ] Add Redis connection tests

## Security Considerations

1. **Environment Variable Management**

   - Never commit `.env.*.local` files
   - Use dummy tokens for local development
   - Secure production tokens in Vercel dashboard
   - Rotate tokens periodically

2. **Data Isolation**

   - Local environments completely isolated from cloud
   - Test data never touches production
   - Preview environment requires access control
   - Consider key prefixes for additional isolation

3. **Access Control**
   - Production tokens restricted to deployment environment
   - Local development uses non-sensitive tokens
   - Preview deployments limited to authorized users
   - Implement audit logging for production access

## Benefits

1. **Development Efficiency**

   - Fast local Redis operations
   - Complete offline development capability
   - Consistent API across all environments
   - Quick feedback loops

2. **Testing Confidence**

   - Identical REST API interface everywhere
   - Fast integration test execution
   - Complete test isolation
   - No production data contamination

3. **Production Safety**
   - Zero code differences between environments
   - Local development isolated from cloud
   - Minimal environment-specific configuration
   - Reduced deployment surprises

## Maintenance

1. **Regular Tasks**

   - Monitor Upstash usage and billing
   - Update Upstash REST server Docker image
   - Clean up stale test data
   - Review and rotate access tokens

2. **Documentation**
   - Keep environment setup guides current
   - Document any API compatibility issues
   - Maintain troubleshooting guide
   - Update this plan with infrastructure changes

## Future Enhancements

1. **Advanced Features**

   - Separate Preview environment database
   - Redis Cluster support for scaling
   - Automated backup and restore
   - Performance monitoring dashboard

2. **Developer Experience**
   - One-command environment setup script
   - Automated health check dashboard
   - Local data seeding tools
   - Development data generators

## Troubleshooting Guide

### Common Issues

1. **Upstash REST Server Connection Failed**

   - Check Docker container is running: `docker ps`
   - Verify port 8079 is not in use: `lsof -i :8079`
   - Check health endpoint: `curl http://localhost:8079/health`

2. **Test Data Conflicts**

   - Ensure test cleanup runs properly
   - Use unique key prefixes per test suite
   - Clear Redis before test runs: `redis-cli FLUSHDB`

3. **Production Connection Issues**

   - Verify Upstash service status
   - Check environment variables in Vercel
   - Validate tokens are current

4. **Docker Compose Issues**

   - Restart containers: `docker-compose down && docker-compose up`
   - Check logs: `docker-compose logs upstash-redis`
   - Rebuild images: `docker-compose build --no-cache`

5. **CI/CD Pipeline Failures**
   - Verify service health checks are passing
   - Check GitHub Actions logs for service startup
   - Ensure environment variables are set correctly

---

This configuration provides a consistent Upstash REST API interface across all environments, enabling seamless development with local performance benefits while maintaining production compatibility.
