# Secrets Management Guide

Sutradhar uses a two-file approach for configuration:
1. **`.env`** - Non-sensitive configuration (can be committed to git with defaults)
2. **`.secrets.env`** - Secrets and sensitive data (NEVER committed to git)

## Setup

### 1. Create Environment File

```bash
# Copy the example file
cp apps/worker/src/env.example .env
```

### 2. Create Secrets File

```bash
# Copy the secrets example
cp .secrets.example .secrets.env

# Edit and add your actual secrets
nano .secrets.env
```

## What Goes Where?

### `.env` (Safe to Commit)
- Port numbers
- Feature flags (MOCK_*)
- Default URLs (without credentials)
- Non-sensitive defaults
- Configuration flags

### `.secrets.env` (NEVER Commit)
- **API Keys**: All external service API keys
- **Account IDs**: Project IDs, Org IDs, User IDs
- **Secrets**: Webhook secrets, passwords
- **Credentials**: Usernames, passwords
- **URLs with Auth**: URLs containing tokens or passwords
- **Sensitive IDs**: Channel IDs, Calendar IDs, Repository slugs

## Secret File Structure

```bash
# API Keys
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
HYPERSPELL_API_KEY=hs_...
AGENTMAIL_API_KEY=am_...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...

# Account IDs
RUBE_PROJECT_ID=proj_...
RUBE_ORG_ID=org_...
RUBE_USER_ID=user_...
MOSS_PROJECT_ID=moss_...

# Service IDs
SLACK_CHANNEL_ID=C123456
GCAL_CALENDAR_ID=calendar@example.com
GITHUB_REPO_SLUG=org/repo

# Secrets
AGENTMAIL_WEBHOOK_SECRET=secret_...
SENTRY_DSN=https://...
```

## Security Best Practices

### ✅ DO
- ✅ Keep `.secrets.env` in `.gitignore` (already configured)
- ✅ Use `.secrets.example` as a template (this IS committed)
- ✅ Rotate secrets regularly
- ✅ Use different secrets for dev/staging/prod
- ✅ Store production secrets in secure vaults (AWS Secrets Manager, etc.)
- ✅ Set proper file permissions: `chmod 600 .secrets.env`

### ❌ DON'T
- ❌ Commit `.secrets.env` to git
- ❌ Share secrets via email or chat
- ❌ Store secrets in code or configuration files
- ❌ Use production secrets in development
- ❌ Hard-code secrets in application code

## File Permissions

Set restrictive permissions on secrets file:

```bash
# Make file readable only by owner
chmod 600 .secrets.env

# Verify permissions
ls -la .secrets.env
# Should show: -rw------- 1 user user ...
```

## Loading Order

The application loads environment variables in this order:

1. **System environment variables** (highest priority)
2. **`.secrets.env`** (if exists)
3. **`.env`** (defaults)

Variables from `.secrets.env` will NOT override system environment variables.

## Docker Deployment

For Docker deployments, use environment variables or Docker secrets:

```yaml
# docker-compose.yml
services:
  worker:
    env_file:
      - .env          # Non-sensitive config
    secrets:
      - secrets_file  # Sensitive secrets
    secrets:
      secrets_file:
        file: ./.secrets.env
```

Or use environment variables directly:

```bash
docker run -e OPENAI_API_KEY=sk-... -e RUBE_API_KEY=... sutradhar-worker
```

## Production Deployment

### Kubernetes
Use Kubernetes Secrets:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: sutradhar-secrets
type: Opaque
stringData:
  OPENAI_API_KEY: sk-...
  RUBE_API_KEY: ...
```

### AWS/GCP/Azure
Use platform-specific secret managers:
- **AWS**: Secrets Manager or Parameter Store
- **GCP**: Secret Manager
- **Azure**: Key Vault

### CI/CD
Store secrets in CI/CD platform:
- **GitHub Actions**: Repository secrets
- **GitLab CI**: CI/CD variables (masked)
- **CircleCI**: Environment variables

## Verifying Secrets Are Not Committed

```bash
# Check if secrets file is in git
git ls-files | grep secrets

# Should return nothing. If it returns .secrets.env, remove it:
git rm --cached .secrets.env
git commit -m "Remove secrets file from git"

# Verify .gitignore
cat .gitignore | grep secrets
# Should show: .secrets.env
```

## Migration from Single .env File

If you have existing secrets in `.env`:

1. **Identify secrets**: Review `.env` and identify sensitive values
2. **Move to `.secrets.env`**: Copy secrets to new file
3. **Remove from `.env`**: Delete secrets from `.env` or comment them out
4. **Test**: Verify application still works
5. **Commit**: Commit the cleaned `.env` file

## Example Migration

```bash
# Before (.env)
OPENAI_API_KEY=sk-1234567890
PERPLEXITY_API_KEY=pplx-abcdef
PORT=2198
MOCK_LLM=false

# After (.env - safe to commit)
# OPENAI_API_KEY=moved to .secrets.env
# PERPLEXITY_API_KEY=moved to .secrets.env
PORT=2198
MOCK_LLM=false

# After (.secrets.env - NOT committed)
OPENAI_API_KEY=sk-1234567890
PERPLEXITY_API_KEY=pplx-abcdef
```

## Troubleshooting

### Secrets Not Loading
- Verify `.secrets.env` exists in project root
- Check file permissions: `ls -la .secrets.env`
- Verify file format (no spaces around `=`)

### Secrets Overridden
- System environment variables take precedence
- Check if secrets are set as system env vars
- Use `echo $VARIABLE_NAME` to check

### Git Still Tracking Secrets
```bash
# Remove from git cache
git rm --cached .secrets.env

# Add to .gitignore (already done)
echo ".secrets.env" >> .gitignore

# Commit the change
git commit -m "Remove secrets from git"
```

## Backup Strategy

**NEVER** commit `.secrets.env` to git, but do keep secure backups:

1. **Encrypted backups**: Store encrypted copies in secure location
2. **Password managers**: Use 1Password, LastPass, etc.
3. **Secret vaults**: Use AWS Secrets Manager, HashiCorp Vault, etc.
4. **Documentation**: Document which secrets are needed (in `.secrets.example`)

## Support

For questions about secrets management:
- Review `.secrets.example` for structure
- Check `SECRETS_MANAGEMENT.md` (this file)
- Verify `.gitignore` includes `.secrets.env`

