# Credential Rotation Guide

## Purpose

This document provides step-by-step instructions for rotating credentials for services used by App Builder Pro. Regular credential rotation is a security best practice that limits the impact of compromised credentials.

## Services Requiring Credentials

| Service | Credential Type | Rotation Frequency | Risk Level |
|---------|-----------------|---------------------|------------|
| Google AI (Gemini) | API Key | Every 90 days | HIGH |
| Supabase | Project URL + Anon Key | Every 180 days | MEDIUM |

---

## Rotation Steps

### 1. Google AI (Gemini) API Key

#### Step 1: Generate New API Key

1. Navigate to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. If not logged in, sign in with your Google account
3. Click "Create API Key" button
4. Select or create a new Google Cloud project (recommended: create new for isolation)
5. Copy the generated API key (it will only be shown once)

#### Step 2: Update Local Configuration

```bash
# Edit .env file
nano .env

# Replace old value with new API key
VITE_GEMINI_API_KEY=your-new-api-key-here
```

Or if using a secrets manager:

```bash
# For example, with direnv or similar
direnv reload
```

#### Step 3: Update CI/CD Secrets (if applicable)

If you use CI/CD pipelines that require the API key:

**GitHub Actions:**
1. Navigate to your repository settings
2. Go to Secrets and variables → Actions
3. Update `GEMINI_API_KEY` secret with new value

**Other CI/CD:**
1. Navigate to your CI/CD provider's secret management
2. Update the `VITE_GEMINI_API_KEY` variable

#### Step 4: Verify New Credentials

Test that the new API key works:

```bash
# Quick test using curl
curl -s \
  -H "Content-Type: application/json" \
  -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_NEW_API_KEY" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

Expected response: JSON with `candidates` array (not an error).

#### Step 5: Revoke Old Credential (after verification)

1. Return to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Find the old API key in your list
3. Click the delete/trash icon
4. Confirm deletion

---

### 2. Supabase Project Credentials

#### Step 1: Generate New Anon Key (Optional - Rotation Recommended)

Supabase anon keys are public by design (they're meant for client-side use), but you can rotate them to invalidate old clients:

1. Navigate to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. In "Project API Keys" section, click "Regenerateanon key"
5. Confirm the action

**Note:** If you regenerate the anon key, all existing clients will need to update their local `.env` files.

#### Step 2: Update Local Configuration

```bash
# Edit .env file
nano .env

# Update both values
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-new-anon-key-here
```

#### Step 3: Update CI/CD Secrets (if applicable)

**GitHub Actions:**
1. Navigate to repository settings
2. Go to Secrets and variables → Actions
3. Update:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_ANON_KEY` (Anon Key)

#### Step 4: Verify New Credentials

Test the connection:

```bash
# Quick health check - replace values
curl -s "https://your-project-ref.supabase.co/rest/v1/" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"
```

Expected: JSON response (may be empty array `[]` if tables don't exist yet)

---

## Affected Services Summary

| Credential | Used By | Location in Code |
|------------|----------|-----------------|
| `VITE_GEMINI_API_KEY` | AIOrchestrator | `src/services/ai/AIOrchestrator.ts` |
| `VITE_SUPABASE_URL` | Supabase client | `src/lib/supabase.ts` |
| `VITE_SUPABASE_ANON_KEY` | Supabase client | `src/lib/supabase.ts` |

---

## Emergency Revocation Procedure

If you suspect credentials have been compromised:

1. **Immediate**: Revoke the credential in the provider dashboard
2. **Update**: Generate new credentials following steps above
3. **Deploy**: Update all environments (local, CI/CD)
4. **Verify**: Confirm the old credential no longer works
5. **Document**: Note the incident for audit purposes

---

## Automation (Future Enhancement)

To automate credential rotation in the future:

- Use Google Cloud Secret Manager
- Use SupabaseVault for secrets
- Implement GitHub Advanced Security secrets scanning
- Set up automatic expiration alerts

---

## Support

- Google AI: [AI Studio Help](https://support.google.com/aistudio)
- Supabase: [Documentation](https://supabase.com/docs)
- Project Issues: Create a GitHub issue for credential-related problems