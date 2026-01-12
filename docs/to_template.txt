# ⚙️ Technisch Ontwerp (TO) – Template

**Projectnaam:** _[vul in]_
**Versie:** _v1.0_
**Datum:** _[dd-mm-jjjj]_
**Auteur:** _[naam]_

---

## 1. Doel en relatie met PRD en FO
🎯 **Doel van dit document:**
Het Technisch Ontwerp (TO) beschrijft **hoe** het systeem technisch wordt gebouwd. Waar het PRD het *wat* beschrijft en het FO het *hoe functioneel*, gaat het TO over architectuur, techstack, data en infrastructuur.

📘 **Toelichting:**
Gebruik dit document om technische keuzes te onderbouwen en developers een duidelijk beeld te geven van de technische implementatie.

---

## 2. Technische Architectuur Overzicht
🎯 **Doel:** Globaal beeld van de systeemarchitectuur.
📘 **Toelichting:** Schets de hoofdcomponenten en hun relaties.

**Voorbeeld (high-level):**
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend    │────▶│  Database   │
│  (Next.js)  │     │  (API Routes)│     │ (Supabase)  │
└─────────────┘     └──────────────┘     └─────────────┘
        │                   │
        │                   ▼
        │           ┌──────────────┐
        └──────────▶│  AI Services │
                    │ (OpenAI/etc) │
                    └──────────────┘
```

---

## 3. Techstack Selectie
🎯 **Doel:** Onderbouwde keuze van technologieën.
📘 **Toelichting:** Beschrijf per component welke technologie je kiest en waarom.

**Voorbeeld:**
| Component | Technologie | Argumentatie | Alternatieven |
|-----------|-------------|--------------|---------------|
| Frontend | Next.js 15 | React framework, SSR, goede DX | SvelteKit, Remix |
| Backend | Next.js API Routes | Co-located met frontend, TypeScript | Express, FastAPI |
| Database | Supabase (PostgreSQL) | Realtime, auth included, gratis tier | Firebase, PlanetScale |
| AI | OpenAI GPT-4 | Betrouwbaar, goede docs, Nederlands | Claude, Gemini |
| Styling | TailwindCSS | Utility-first, snel prototypen | styled-components |
| Hosting | Vercel | Zero-config Next.js, preview deploys | Netlify, Railway |

---

## 4. Datamodel
🎯 **Doel:** Structuur van de data in de database.
📘 **Toelichting:** Beschrijf de belangrijkste tabellen/collections en hun relaties.

**Voorbeeld (PostgreSQL):**
```sql
-- Users
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  role TEXT,
  created_at TIMESTAMP
)

-- Clients
clients (
  id UUID PRIMARY KEY,
  name TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP
)

-- Intakes
intakes (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  content TEXT,
  ai_summary TEXT,
  created_at TIMESTAMP
)
```

**ERD (optioneel):**
```
users ─1:N─ clients ─1:N─ intakes
```

---

## 5. API Ontwerp
🎯 **Doel:** Overzicht van belangrijkste endpoints.
📘 **Toelichting:** Beschrijf REST/GraphQL endpoints, input/output en authenticatie.

**Voorbeeld (REST):**
| Endpoint | Method | Input | Output | Auth |
|----------|--------|-------|--------|------|
| `/api/clients` | GET | - | `Array<Client>` | Required |
| `/api/clients` | POST | `{ name }` | `Client` | Required |
| `/api/clients/:id` | GET | - | `Client` | Required |
| `/api/ai/summarize` | POST | `{ text }` | `{ summary }` | Required |
| `/api/ai/extract` | POST | `{ text }` | `{ categories, severity }` | Required |

**Authenticatie:**
- Session-based via Supabase Auth
- JWT tokens in HTTP-only cookies
- CSRF protection via SameSite cookies

---

## 6. Security & Compliance
🎯 **Doel:** Beschrijf security maatregelen en compliance vereisten.
📘 **Toelichting:** Vooral relevant voor zorg, finance, overheid.

**Security Checklist:**
- [ ] **Authentication:** Supabase Auth (OAuth, MFA support)
- [ ] **Authorization:** Row Level Security (RLS) policies
- [ ] **Data Encryption:** At rest (PostgreSQL), in transit (HTTPS)
- [ ] **Input Validation:** Zod schemas op alle endpoints
- [ ] **Rate Limiting:** Vercel Edge Functions (100 req/min)
- [ ] **CORS:** Restrictive origins (alleen eigen domein)
- [ ] **Secrets Management:** Environment variables, niet in code

**Compliance (AVG/GDPR):**
- Data minimalisatie: Alleen noodzakelijke velden opslaan
- Consent: Expliciete toestemming voor AI-verwerking
- Right to deletion: `/api/users/:id/delete` endpoint
- Data export: `/api/users/:id/export` endpoint (JSON)
- Logging: Audit trail voor data access (wie, wanneer, wat)

**NEN7510 (voor zorginstellingen):**
- Toegangscontrole per rol (behandelaar, manager, admin)
- Logging van medische dossier toegang
- Encryptie van gevoelige velden (BSN, medische data)

---

## 7. AI/LLM Integratie
🎯 **Doel:** Technische details van AI-gebruik.
📘 **Toelichting:** Beschrijf hoe AI wordt geïntegreerd, welke modellen, prompts, fallbacks.

**AI Stack:**
- **Provider:** OpenAI (gpt-4-turbo)
- **Library:** OpenAI SDK (JavaScript/Python)
- **Prompting:** System prompts + few-shot examples
- **Caching:** Redis voor repeated prompts (kosten besparing)
- **Fallback:** Error handling → default response + user notification

**Voorbeeld Prompt Template:**
```typescript
const SUMMARIZE_PROMPT = `
Je bent een medisch assistent. Vat de volgende intake samen in maximaal 3 bullets.

Format:
- [hoofdprobleem]
- [relevante context]
- [actie suggestie]

Intake:
${intakeText}
`;
```

**Cost Management:**
- Token limits: Max 4000 tokens per request
- Caching: Identical prompts cached 1 hour
- Monitoring: Track costs per endpoint via OpenAI dashboard

---

## 8. Performance & Scalability
🎯 **Doel:** Hoe schaalt het systeem bij groei?
📘 **Toelichting:** Beschrijf performance targets en schaalbaarheid.

**Performance Targets:**
- Page load: < 2 seconden (First Contentful Paint)
- API response: < 500ms (excl. AI calls)
- AI response: < 5 seconden (GPT-4)

**Scalability Strategie:**
- **Frontend:** Vercel Edge Network (CDN, global caching)
- **Backend:** Serverless functions (auto-scaling)
- **Database:** Supabase (vertical scaling, read replicas)
- **AI:** Queue systeem (Bull/BullMQ) voor batch processing

**Caching:**
- Static assets: CDN cache (immutable)
- API responses: Redis (5 min TTL)
- AI results: Database cache (1 uur, per prompt hash)

---

## 9. Deployment & CI/CD
🎯 **Doel:** Hoe wordt het systeem gedeployed en getest?
📘 **Toelichting:** Beschrijf deployment pipeline en omgevingen.

**Omgevingen:**
- **Development:** Lokaal (localhost:3000)
- **Staging:** Vercel preview (PR builds)
- **Production:** Vercel production (main branch)

**CI/CD Pipeline:**
```
Git Push → GitHub Actions → [Lint, Test, Build] → Vercel Deploy
```

**Deployment Checklist:**
- [ ] Environment variables set (Vercel dashboard)
- [ ] Database migrations run (Supabase migrations)
- [ ] Smoke tests passed (Playwright E2E)
- [ ] Monitoring configured (Sentry, LogRocket)

---

## 10. Monitoring & Logging
🎯 **Doel:** Hoe monitoren we het systeem in productie?
📘 **Toelichting:** Beschrijf logging, error tracking, analytics.

**Tools:**
- **Error Tracking:** Sentry (crashes, exceptions)
- **Logging:** Vercel Logs (server-side), Console (client-side)
- **Analytics:** Vercel Analytics (traffic, performance)
- **Uptime:** UptimeRobot (ping endpoints elke 5 min)

**Key Metrics:**
- Uptime: Target 99.5%
- Error rate: < 1% of requests
- AI success rate: > 95% (non-error responses)
- Response time p95: < 1 seconde

---

## 11. Risico's & Technische Mitigatie
🎯 **Doel:** Technische risico's vroegtijdig identificeren.
📘 **Toelichting:** Beschrijf risico's en hoe je ze technisch aanpakt.

**Voorbeeld:**
| Risico | Impact | Waarschijnlijkheid | Mitigatie |
|--------|--------|-------------------|-----------|
| OpenAI API down | Hoog | Laag | Fallback naar Claude, error messages |
| Database overload | Hoog | Middel | Connection pooling, query optimization |
| Security breach | Kritiek | Laag | RLS policies, input validation, audit logs |
| Vendor lock-in (Supabase) | Middel | Laag | Abstract DB layer, export scripts ready |
| Cost overrun (AI) | Middel | Middel | Token limits, caching, usage monitoring |

---

## 12. Bijlagen & Referenties
🎯 **Doel:** Linken naar tech docs en tooling.

**Projectdocumenten:**
- PRD (Product Requirements Document)
- FO (Functioneel Ontwerp)
- Mission Control / Build Plan

**Tech Documentatie:**
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- OpenAI: https://platform.openai.com/docs
- Vercel: https://vercel.com/docs

**Code Repositories:**
- GitHub: [link]
- Figma designs: [link]
