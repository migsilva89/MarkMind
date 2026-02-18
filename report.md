# Architecture Decision: Two-Phase AI Organization

## The Question

> Why does MarkMind use **two separate AI calls** (planning + assignment) instead of one combined call where we map bookmarks to folders in application code?

---

## What Each Phase Does

### Phase 1 — Planning (popup context)

**Prompt sends:** All bookmarks + existing folder tree
**AI returns:** Proposed folder structure with descriptions

```json
{
  "folders": [
    { "path": "Bookmarks/AI/Tools", "description": "AI chatbots and apps", "isNew": false },
    { "path": "Bookmarks/AI/Development", "description": "AI dev resources", "isNew": true }
  ],
  "summary": "Reorganized into 12 folders..."
}
```

**User then reviews** the plan — can exclude folders, toggle individual items, re-plan entirely.

### Phase 2 — Assignment (service worker context)

**Prompt sends:** Approved folder list + batches of 25 bookmarks
**AI returns:** Each bookmark mapped to its best folder

```json
[
  { "bookmarkId": "123", "suggestedPath": "Bookmarks/AI/Tools" },
  { "bookmarkId": "456", "suggestedPath": "Bookmarks/AI/Development" }
]
```

**User then reviews** every assignment — can toggle individual bookmarks before applying.

---

## Why Not One Call + Code Mapping?

The idea: have Phase 1 return the folder plan, then use application code (keyword matching, domain matching) to assign bookmarks to folders — no Phase 2 AI call.

### The problem: assignment requires semantic understanding

Consider this bookmark:

```
Title: "Advanced TypeScript Patterns"
URL:   https://blog.example.com/ts-patterns
```

Available folders after Phase 1:
- `Programming/TypeScript`
- `Learning/Tutorials`
- `Web Development/Frontend`

**Code can try keyword matching:** `"TypeScript"` appears in both the title and `Programming/TypeScript` — match! But what about:

```
Title: "React Server Components Deep Dive"
URL:   https://vercel.com/blog/rsc
```

No keyword matches any folder name. Code can't determine if this belongs in `Web Development/Frontend`, `Learning/Tutorials`, or `Programming/React`. Only AI understands the semantic relationship between "React Server Components" and "Web Development/Frontend".

**Real-world accuracy comparison:**

| Approach | Estimated accuracy | Handles edge cases? |
|---|---|---|
| AI assignment (Phase 2) | ~90-95% | Yes — understands context |
| Keyword matching in code | ~40-50% | No — literal string matching only |
| Domain-based matching | ~30-40% | No — `blog.example.com` tells nothing |

MarkMind's core value proposition is **AI-powered organization**. Replacing the assignment step with naive code matching would produce disappointing results and undermine the product.

---

## Why Not One Combined AI Call?

The alternative: merge both phases into a single AI call that returns the folder plan AND all assignments together.

```json
{
  "folders": [...],
  "assignments": [
    { "bookmarkId": "123", "suggestedPath": "Bookmarks/AI/Tools" },
    ...
  ],
  "summary": "..."
}
```

This was seriously considered. Here's why it was rejected:

### 1. Popup close kills the call

The combined call runs in **popup context**. Chrome extension popups are ephemeral — clicking anywhere outside the popup closes it and destroys all running JavaScript, including in-flight `fetch` calls.

- **Combined call:** One large request (10-30+ seconds). If popup closes → entire result lost, start over.
- **Two-phase approach:** Phase 2 runs in the **service worker**, which survives popup closes. Users can close the popup, browse the web, and come back — their assignment progress is preserved.

### 2. Token limits and truncation risk

For 200 bookmarks, a combined response would need:
- ~3,000-5,000 tokens for the folder plan
- ~8,000-15,000 tokens for 200 assignments
- ~4,000-10,000 tokens for Gemini's "thinking" overhead
- **Total: ~15,000-30,000 output tokens in a single response**

Gemini 2.5 Flash (free tier) already hit `MAX_TOKENS` truncation at 4,096 tokens due to thinking overhead. A combined response for large bookmark sets pushes the limits much further. If the response gets truncated, **everything is lost** — both the plan and assignments.

With two phases:
- Phase 1 returns just the plan (~2,000-4,000 tokens) — manageable
- Phase 2 processes in batches of 25 bookmarks (~500-1,000 tokens each) — well within limits
- If a batch fails, only 25 bookmarks are affected — retry or mark as unassigned

### 3. User review between phases matters

The two-phase approach gives users a checkpoint:

```
Scan → Select folders → [Phase 1: AI plans] → User reviews plan → [Phase 2: AI assigns] → User reviews assignments → Apply
```

If we combined both phases, the user would see the folder plan AND assignments simultaneously. But what if they want to exclude a folder? All bookmarks assigned to that folder need to be reassigned — **either silently dropped or assigned to a fallback**, neither of which is good UX.

With separate phases:
1. User reviews and modifies the plan (exclude folders, keep others)
2. Phase 2 only assigns to **approved** folders — no wasted assignments to excluded folders
3. AI gets a cleaner, more constrained task → better accuracy

### 4. Batch processing enables resilience

Phase 2 processes bookmarks in batches of 25. This provides:

- **Rate limit safety:** Free tier APIs limit requests per minute. Small batches spread the load.
- **Partial progress:** If batch 3 of 8 fails, batches 1-2 are saved. The user keeps 50 successful assignments.
- **Retry logic:** Failed batches get one retry before marking as unassigned — no silent gaps.
- **Pause/resume:** User can pause processing and resume later.

A single combined call is all-or-nothing — one failure means zero results.

---

## Summary: Why Two Phases Wins

| Criteria | One combined call | Two phases (current) |
|---|---|---|
| Survives popup close | No | **Yes (service worker)** |
| Token truncation risk | High (large response) | **Low (small batches)** |
| User control | Plan + assignments at once | **Review plan first, then assignments** |
| Partial failure handling | All-or-nothing | **Batch-level retry** |
| Pause/resume | Not possible | **Supported** |
| Rate limit friendly | Single large call | **Spread across small batches** |
| API cost | Similar | Similar |

The two-phase architecture trades one extra round of API calls for **resilience**, **user control**, and **robustness against the real-world constraints of Chrome extension popups and free-tier API limits**.

---

## Recent Improvements (Feb 2025)

The following issues were identified and fixed during testing with Gemini 2.5 Flash free tier:

1. **Truncation detection** — All four providers (Gemini, OpenAI, Anthropic, OpenRouter) now detect when a response is truncated and throw a clear error instead of silently returning broken JSON.

2. **Token budget increase** — Planning budget increased from 4,096 to 16,384, assignment budget from 1,500 to 8,192. Gemini 2.5 Flash uses "thinking" tokens that consume the output budget, requiring higher limits.

3. **Session recovery** — If the popup closes during scanning, planning, or applying (which run in popup context), the session now resets to the last safe state instead of getting stuck on an infinite spinner.

4. **Cancel button** — The planning spinner screen now has a cancel button so users can always exit back to folder selection.
