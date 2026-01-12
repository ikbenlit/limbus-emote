# 🚀 Mission Control — Bouwplan Template

💡 **Tip:** Dit document kun je samenstellen met hulp van AI-tools zoals **ChatGPT, Claude, Cursor** of **Gemini**.  
Gebruik ze als **sparringpartner** om de bouw van je software te plannen, te documenteren en te verbeteren — zelfs als je geen ontwikkelaar bent.  
Afhankelijk van de **complexiteit van je software** bepaal je zelf hoe gedetailleerd je elk onderdeel uitwerkt. Voor kleine prototypes volstaat een beknopt overzicht; voor grotere projecten kun je per fase en subfase inzoomen.

---

**Projectnaam:** _[vul in]_  
**Versie:** _v1.0_  
**Datum:** _[dd-mm-jjjj]_  
**Auteur:** _[Colin Lit]_  

---

## 1. Doel en context
🎯 **Doel:** Leg uit wat je gaat bouwen en waarom.  
📘 **Toelichting:** Beschrijf kort de aanleiding voor het project en hoe het past binnen je organisatie of productstrategie. Verwijs hier naar het PRD of FO voor achtergrond.

**Voorbeeld:**  
> Het doel is een werkend MVP te bouwen van de AI-assistent voor zorgdossiers. We tonen de meerwaarde van AI binnen de intake → profiel → plan workflow.

---

## 2. Uitgangspunten

### 2.1 Technische Stack
🎯 **Doel:** Benoem de technologieën en frameworks die worden gebruikt.  
📘 **Toelichting:** Denk aan frontend, backend, database, hosting en externe services.

**Voorbeeld:**  
- **Frontend:** SvelteKit + Tailwind CSS + Lucide Icons
- **Backend:** Firebase Functions / Next.js API Routes
- **Database:** Firestore / PostgreSQL
- **AI/ML:** Vertex AI (Gemini) / OpenAI API
- **Hosting:** Vercel / Firebase Hosting
- **Auth:** Firebase Auth / Supabase Auth

### 2.2 Projectkaders
🎯 **Doel:** Benoem de vaste kaders waarbinnen het project wordt ontwikkeld.  
📘 **Toelichting:** Denk aan beperkingen (tijd, budget, resources) en aannames.

**Voorbeeld:**  
- **Tijd:** 3 weken bouwtijd voor MVP  
- **Budget:** €X voor externe services (API calls, hosting)
- **Team:** 1 developer + 1 consultant/sparringpartner
- **Data:** Geen productiegegevens (alle data fictief voor demo)
- **Doel:** Demo op AI-inspiratiesessie

### 2.3 Programmeer Uitgangspunten
🎯 **Doel:** Vastleggen van code-kwaliteit principes en development best practices.  
📘 **Toelichting:** Deze principes gelden voor alle code die in dit project wordt geschreven.

**Code Quality Principles:**

- **DRY (Don't Repeat Yourself)**
  - Herbruikbare componenten en functies
  - Centrale configuratie voor herhaalde waarden
  - Utility functions voor gemeenschappelijke logica

- **KISS (Keep It Simple, Stupid)**
  - Eenvoudige oplossingen boven complexe architectuur
  - Duidelijke naamgeving (spreekt voor zich)
  - Vermijd premature optimization

- **SOC (Separation of Concerns)**
  - UI-componenten gescheiden van business logic
  - API-calls in dedicated service layers
  - Database queries in repository/model layers
  - Styling gescheiden van functionaliteit

- **YAGNI (You Aren't Gonna Need It)**
  - Bouw alleen wat nu nodig is
  - Geen features "voor later"
  - Iteratief uitbreiden op basis van feedback

**Development Practices:**

- **Code Organization**
  - Consistent folder structure (`/components`, `/lib`, `/routes`, `/api`)
  - Één component/functie per file waar logisch
  - Index files voor clean imports

- **Error Handling**
  - Try-catch blocks op alle async operaties
  - User-friendly foutmeldingen in UI
  - Logging van errors naar console/monitoring

- **Security**
  - Nooit API keys in frontend code
  - Input validation op alle user input
  - Firestore/database rules voor data access control
  - CORS configuratie voor API endpoints

- **Performance**
  - Lazy loading waar mogelijk
  - Debounce op search/input handlers
  - Optimized images en assets
  - Minimal bundle size (tree-shaking)

- **Testing**
  - Unit tests voor kritieke business logic
  - Integration tests voor API endpoints
  - Smoke tests voor belangrijkste flows
  - Manual testing checklist voor demo

- **Documentation**
  - README met setup instructies
  - Inline comments voor complexe logica
  - JSDoc/TypeScript types voor public APIs
  - Architecture Decision Records (ADR) voor belangrijke keuzes

**Voorbeeld implementatie:**
```typescript
// ❌ NIET - Violation of DRY
if (user.role === 'admin') { /* ... */ }
if (user.role === 'admin') { /* ... */ }

// ✅ WEL - DRY principle
const isAdmin = (user) => user.role === 'admin';
if (isAdmin(user)) { /* ... */ }

// ❌ NIET - Violation of SOC
<button onClick={() => {
  fetch('/api/data').then(r => r.json()).then(data => {
    setState(data);
  });
}}>
  Load
</button>

// ✅ WEL - SOC principle
// In /lib/api.ts
export const loadData = async () => {
  const response = await fetch('/api/data');
  return response.json();
};

// In component
<button onClick={handleLoad}>Load</button>
```

---

## 3. Epics & Stories Overzicht
🎯 **Doel:** De bouw opdelen in logische epics (fases) met stories (subfases).  
📘 **Toelichting:** Elke epic bevat het doel, afhankelijkheden en status. Stories zijn de uitvoerbare taken binnen een epic.

**Epic Structuur:**
| Epic ID | Titel | Doel | Status | Stories | Opmerkingen |
|---------|-------|------|--------|---------|-------------|
| E0 | Setup & Configuratie | Repo, omgeving, dependencies | ✅ Gereed | 4 | Config getest |
| E1 | Data & Database | Datamodel en demo-data | 🔄 In Progress | 3 | Rules nog aanvullen |
| E2 | UI & Layout | Interface, navigatie, componenten | ⏳ To Do | 3 | Wireframes gereed |
| E3 | AI-integratie | AI endpoints en prompt engineering | ⏳ To Do | 3 | Test met Gemini model |
| E4 | Testing & Deploy | QA, demo prep en deployment | ⏳ To Do | 3 | |

**Belangrijk:** Voer niet in 1x het volledige plan uit. Bouw per epic en per story.
**Belangrijk:** Het installeren van dependencies en libraries, of het uitvoeren van migraties van tabellen, moet altijd eerst aan Colin worden gemeld of gevraagd. Colin kan deze zelf eventueel uitvoeren.

---

## 4. Epics & Stories (Uitwerking)
🎯 **Doel:** Verdeel complexe epics in beheersbare stories voor meer overzicht.  
📘 **Toelichting:** Je bepaalt zelf het detailniveau. Kleine projecten kunnen volstaan met 2-3 stories per epic; grotere implementaties kunnen tot 10 stories bevatten.

### Epic 0 — Setup & Configuratie
**Epic Doel:** Werkende development omgeving met alle benodigde tools en dependencies.

| Story ID | Beschrijving | Acceptatiecriteria | Status | Afhankelijkheden | Story Points |
|----------|--------------|---------------------|--------|------------------|--------------|
| E0.S1 | Repository aanmaken | GitHub repo + lokale clone, `.gitignore` config | ✅ | — | 1 |
| E0.S2 | Project initialisatie | `npm create` draait, dev server start | ✅ | E0.S1 | 2 |
| E0.S3 | Dependencies installeren | Tailwind, Firebase, TypeScript geïnstalleerd | 🔄 | E0.S2 | 2 |
| E0.S4 | Environment variables | `.env.local` + Vercel vars geconfigureerd | ⏳ | E0.S3 | 1 |

**Technical Notes:**
- ⚠️ **Belangrijk:** Dependencies installeren moet eerst aan Colin worden gemeld of gevraagd. Colin kan deze zelf eventueel uitvoeren.
- Gebruik `pnpm` voor snellere installs
- `.env.example` committen voor team onboarding

---

### Epic 1 — Data & Database
**Epic Doel:** Werkend datamodel met seed data voor development en demo.

| Story ID | Beschrijving | Acceptatiecriteria | Status | Afhankelijkheden | Story Points |
|----------|--------------|---------------------|--------|------------------|--------------|
| E1.S1 | Datamodel ontwerpen | ERD/schema gedocumenteerd, collections defined | 🔄 | E0.S4 | 3 |
| E1.S2 | Security Rules implementeren | Firestore rules geschreven en getest | ⏳ | E1.S1 | 3 |
| E1.S3 | Demo-data seeden | 3+ testcliënten met complete intake data | ⏳ | E1.S1 | 2 |

**Technical Notes:**
- ⚠️ **Belangrijk:** Migraties van tabellen moeten eerst aan Colin worden gemeld of gevraagd. Colin kan deze zelf eventueel uitvoeren.
- Collections: `clients`, `intakes`, `plans`, `ai_events`
- Demo user heeft `all access` voor development
- Seed script: `npm run seed`

---

### Epic 2 — UI & Layout
**Epic Doel:** Gebruiksvriendelijke interface volgens UX/FO specificatie.

| Story ID | Beschrijving | Acceptatiecriteria | Status | Afhankelijkheden | Story Points |
|----------|--------------|---------------------|--------|------------------|--------------|
| E2.S1 | Layout skelet bouwen | Topbalk + linker navigatie responsive | ⏳ | E1.S3 | 5 |
| E2.S2 | Component library setup | Herbruikbare buttons, cards, forms | ⏳ | E2.S1 | 3 |
| E2.S3 | Routing & navigatie | `/clients/[id]` structuur werkt, breadcrumbs | ⏳ | E2.S1 | 3 |

**Technical Notes:**
- shadcn/ui componenten of custom Tailwind components
- Keyboard shortcuts: Ctrl+S (save), Cmd+K (search)
- Mobile-first approach

---

### Epic 3 — AI-integratie
**Epic Doel:** Werkende AI-features voor samenvatten, extraheren en plannen genereren.

| Story ID | Beschrijving | Acceptatiecriteria | Status | Afhankelijkheden | Story Points |
|----------|--------------|---------------------|--------|------------------|--------------|
| E3.S1 | Vertex AI configuratie | GCP project + SA key, test call succesvol | ⏳ | E0.S4 | 3 |
| E3.S2 | API endpoints bouwen | `/api/summarize`, `/extract`, `/plan` werken | ⏳ | E3.S1, E1.S3 | 8 |
| E3.S3 | Logging & monitoring | AI calls loggen naar `ai_events` collection | ⏳ | E3.S2 | 2 |

**Technical Notes:**
- Model: `gemini-1.5-pro` of `gemini-2.0-flash`
- Prompt templates in `/lib/prompts/`
- Error handling voor rate limits en API failures
- Response caching voor repeated calls

---

### Epic 4 — Testing & Deployment
**Epic Doel:** Stabiele, geteste applicatie live op productie omgeving.

| Story ID | Beschrijving | Acceptatiecriteria | Status | Afhankelijkheden | Story Points |
|----------|--------------|---------------------|--------|------------------|--------------|
| E4.S1 | Smoke tests uitvoeren | Alle happy flows werken zonder crashes | ⏳ | E3.S3 | 3 |
| E4.S2 | Demo dry-run | Volledige demo in max 10 minuten | ⏳ | E4.S1 | 2 |
| E4.S3 | Productie deployment | Live op Vercel, environment vars gezet | ⏳ | E4.S2 | 2 |

**Technical Notes:**
- Test scenarios gedocumenteerd in `/docs/test-plan.md`
- Vercel deployment: EU region (Amsterdam)
- Rollback plan als deployment faalt

---

## 5. Kwaliteit & Testplan
🎯 **Doel:** vastleggen hoe de kwaliteit van het project wordt geborgd.  
📘 **Toelichting:** Licht toe welke tests je uitvoert en hoe je weet dat de build stabiel is.

### Test Types
| Test Type | Scope | Tools | Verantwoordelijke |
|-----------|-------|-------|-------------------|
| Unit Tests | Business logic, utilities | Vitest / Jest | Developer |
| Integration Tests | API endpoints, database | Playwright / Supertest | Developer |
| Smoke Tests | Kritieke user flows | Manual checklist | QA / Developer |
| Performance Tests | Load times, API response | Lighthouse, Network tab | Developer |
| Security Tests | Auth, data access, XSS | Manual + OWASP checklist | Developer |

### Test Coverage Targets
- **Unit tests:** 80%+ coverage op `/lib` folder
- **Integration tests:** Alle API endpoints
- **Smoke tests:** 3 happy flows + 2 error scenarios

### Manual Test Checklist (voor demo)
- [ ] User kan inloggen
- [ ] Nieuwe cliënt aanmaken werkt
- [ ] Intake formulier opslaan werkt
- [ ] AI samenvatting genereert binnen 5 sec
- [ ] Behandelplan wordt gegenereerd
- [ ] Navigatie werkt zonder errors
- [ ] Mobile view is responsive
- [ ] Error states tonen user-friendly messages

---

## 6. Demo & Presentatieplan
🎯 **Doel:** beschrijven hoe de demo wordt gepresenteerd of getest.  
📘 **Toelichting:** Vermeld wat je laat zien, wie betrokken is en welk scenario wordt gevolgd.

### Demo Scenario
**Duur:** 10 minuten  
**Doelgroep:** Zorgorganisatie stakeholders + management  
**Locatie:** Live op Vercel (backup: localhost)

**Flow:**
1. **Intro** (1 min): Context en doel van de AI-assistent
2. **Nieuwe cliënt** (2 min): Aanmaken + intake invullen
3. **AI in actie** (4 min): 
   - Samenvatting genereren
   - Belangrijkste punten extractie
   - Behandelplan voorstel
4. **Interactie** (2 min): Aanpassingen maken, opslaan
5. **Afsluiting** (1 min): Vragen + next steps

**Backup Plan:**
- Lokale versie klaar bij internet issues
- Pre-seeded data als AI API niet reageert
- Screenshots als complete fallback

---

## 7. Risico's & Mitigatie
🎯 **Doel:** risico's vroeg signaleren en voorzien van oplossingen.
📘 **Toelichting:** Gebruik dit als dynamische checklist.

| Risico | Kans | Impact | Mitigatie | Owner |
|--------|------|--------|-----------|-------|
| AI-output inconsistent | Hoog | Hoog | Snapshot tests, prompt versioning, fallback responses | Developer |
| API rate limits tijdens demo | Middel | Hoog | Caching, pre-warmed responses, backup data | Developer |
| Firebase regels te open | Middel | Hoog | Strikte rules voor productie, security audit | Developer |
| Tijdsdruk deadline | Hoog | Middel | Prioriteer MVP features, cut scope indien nodig | PM |
| Browser compatibility issues | Laag | Middel | Test op Chrome, Safari, Firefox | QA |
| Environment vars niet gezet | Middel | Hoog | `.env.example` + deployment checklist | DevOps |

---

## 8. Evaluatie & Lessons Learned
🎯 **Doel:** reflecteren op het proces en verbeteringen vastleggen.
📘 **Toelichting:** noteer inzichten na elke sprint of oplevering.

**Te documenteren na project:**
- Wat ging goed? Wat niet?
- Welke AI-tools waren het meest effectief?
- Welke prompts werkten het beste?
- Waar liepen we vertraging op?
- Wat doen we volgende keer anders?
- Herbruikbare componenten voor volgende projecten

---

## 9. Referenties
🎯 **Doel:** koppelen aan de overige Mission Control-documenten.

**Mission Control Documents:**
- **PRD** — Product Requirements Document  
- **FO** — Functioneel Ontwerp  
- **TO** — Technisch Ontwerp  
- **UX/UI** — Design specificatie  
- **API Access** — Authenticatie en endpoints documentatie

**External Resources:**
- Repository: `https://github.com/[org]/[project]`
- Deployment: `https://[project].vercel.app`
- Design: Figma link
- Documentation: `/docs` folder in repo

---

## 10. Glossary & Abbreviations

| Term | Betekenis |
|------|-----------|
| Epic | Grote feature of fase in development (bevat meerdere stories) |
| Story | Kleine, uitvoerbare taak binnen een epic |
| Story Points | Schatting van complexiteit (Fibonacci: 1, 2, 3, 5, 8, 13) |
| MVP | Minimum Viable Product |
| DRY | Don't Repeat Yourself |
| KISS | Keep It Simple, Stupid |
| SOC | Separation of Concerns |
| YAGNI | You Aren't Gonna Need It |
| SA | Service Account (GCP) |
| ADR | Architecture Decision Record |

---

**Versiehistorie:**

| Versie | Datum | Auteur | Wijziging |
|--------|-------|--------|-----------|
| v1.0 | [datum] | [naam] | Initiële versie |