# Key rotation before deploy

Rotate these secrets **before** deploying and starting the container so production never uses old or shared dev keys.

---

## 1. Order of operations

1. Generate new values (see below).
2. Update **production** env only (e.g. server `.env`, CI secrets, or container env). Do not commit secrets to git.
3. Deploy and start the container with the new env.
4. After deploy: all users will get new sessions (NEXTAUTH_SECRET rotation invalidates existing JWTs).

---

## 2. Keys to rotate

| Key | Purpose | How to generate / rotate |
|-----|---------|---------------------------|
| **NEXTAUTH_SECRET** | Signs/encrypts NextAuth JWTs and cookies | `openssl rand -base64 32` | check
| **NEXTAUTH_URL** | Canonical app URL (no secret, set correctly) | e.g. `https://yourdomain.com` |  check?
| **DATABASE_URL** | DB connection (pooled) | New password in Neon/Postgres, then update URL | check
| **DATABASE_URL_UNPOOLED** | DB direct (migrations) | Same as above if same DB | check
| **RESEND_API_KEY** | Sending email | New key in Resend dashboard, revoke old | check
| **EMAIL_FROM** | Sender address (not secret) | Set to your verified domain |
| **MENDELEY_CLIENT_SECRET** | Mendeley OAuth | New secret in Mendeley app config, update env |
| **MENDELEY_CLIENT_ID** | Mendeley OAuth (public) | Usually unchanged |
| **MENDELEY_REDIRECT_URI** | Mendeley callback (not secret) | e.g. `https://yourdomain.com/api/auth/mendeley/callback` |
| **JWT_SECRET** | (If used elsewhere) | `openssl rand -base64 32` | check
| **ENCRYPTION_KEY** | (If used for encrypting data) | `openssl rand -base64 32` | check
| **IONOS_DNS_SECRET** | IONOS DNS API (if used in deploy) | Rotate in IONOS, update CI/server env |
| **IONOS_DNS_PREFIX** | IONOS DNS (if used) | Usually unchanged |

---

## 3. Quick commands

```bash
# Generate a strong secret (use for NEXTAUTH_SECRET, JWT_SECRET, ENCRYPTION_KEY)
openssl rand -base64 32
```

---

## 4. After rotating NEXTAUTH_SECRET

- Existing sessions (cookies) become invalid.
- Users must sign in again. No data migration needed.

---

## 5. Where to set production values (GitHub Actions)

This project uses **GitHub Actions secrets** for production. The deploy workflow (` .github/workflows/deploy-production.yml`) writes them to `.env` on the VPS in the “Write .env on server” step.

**Where to rotate:**  
Repo → **Settings** → **Secrets and variables** → **Actions** (and/or **Environments** → **Production** if you use environment secrets).

**Secret names the workflow expects** (update these for key rotation):

| Secret | Used for |
|--------|----------|
| `NEXTAUTH_SECRET` | NextAuth JWT signing |
| `NEXTAUTH_URL` | App URL (e.g. `https://evidoxa.com`) |
| `DATABASE_URL` | DB connection (pooled) |
| `DATABASE_URL_UNPOOLED` | DB connection (migrations) |
| `RESEND_API_KEY` | Email (Resend) |
| `EMAIL_FROM` | Sender address |
| `ENCRYPTION_KEY` | App encryption |
| `JWT_SECRET` | JWT (if used) |
| `REDIS_PASSWORD` | Redis auth |
| `REDIS_URL` | Redis connection |
| `IONOS_DNS_PREFIX` | IONOS DNS API |
| `IONOS_DNS_SECRET` | IONOS DNS API |
| `AUTHKIT_REDIRECT_URI` | AuthKit redirect (if used) |
| `DOMAIN` | Deploy/SSL domain |
| `SSL_EMAIL` | Certbot/SSL |
| `MYSQL_PASSWORD` | WordPress DB user |
| `MYSQL_ROOT_PASSWORD` | WordPress DB root |
| `VPS_SSH_KEY` | SSH deploy key (rotate separately if needed) |

After changing a secret in GitHub, the next deploy (push to `main`) will write the new values to the server and restart the app. To rotate without a code push, re-run the “Deploy to Production” workflow from the Actions tab.

If you use **Mendeley** in production, add the corresponding env vars to the “Write .env on server” step and create secrets: `MENDELEY_CLIENT_ID`, `MENDELEY_CLIENT_SECRET`, `MENDELEY_REDIRECT_URI`.

---

## 6a. Rotating `VPS_SSH_KEY` (deploy key)

Rotating the SSH key is recommended (e.g. with other keys or periodically). Do it in this order so the next deploy still works:

1. **Generate a new key pair** (on your machine):
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f vps_deploy_key -N ""
   ```
   This creates `vps_deploy_key` (private) and `vps_deploy_key.pub` (public).

2. **Add the new public key on the VPS** (before changing the GitHub secret):
   ```bash
   # From your machine, copy the public key to the server (use your current access method)
   cat vps_deploy_key.pub | ssh root@217.154.198.215 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
   ```
   Or paste the contents of `vps_deploy_key.pub` into `~/.ssh/authorized_keys` on the VPS.

3. **Update the GitHub secret:**  
   In **Settings → Secrets and variables → Actions**, set `VPS_SSH_KEY` to the **entire contents** of `vps_deploy_key` (private key), including the `-----BEGIN ... -----` and `-----END ... -----` lines.

4. **Test:** Re-run the “Deploy to Production” workflow or push to `main`. If SSH connection succeeds, the new key is in use.

5. **Optional:** Remove the old public key from `~/.ssh/authorized_keys` on the VPS so only the new key can log in.

---

## 6. Checklist before deploy

- [ ] New `NEXTAUTH_SECRET` generated and set in production env only.
- [ ] `NEXTAUTH_URL` set to production URL (https).
- [ ] Production DB URLs use production DB and a dedicated (strong) password.
- [ ] `RESEND_API_KEY` is a production key (or new key), not the dev key.
- [ ] Mendeley production app has its own client secret; that value is in production env only.
- [ ] IONOS / DNS secrets (if used) are production values and only in CI/server env.
- [ ] No production secrets committed; `.env` and `.env.production` are in `.gitignore`.
