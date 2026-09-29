# QuoaraAi Milestone 2 — Intelligence Foundation

## Implemented in code now
- Owner-first governance engine
- 20-capability manifest and control-center page
- Project and goal APIs
- Human approval/rejection API for pending actions
- Action-ledger persistence layer
- Model-routing planner
- Council-role planner
- Verification/confidence scoring
- Cost-selection helper
- Versioned skill-package validation
- Database schema for projects, goals, approved/pending memory, skills, learning candidates, approval requests, ledger, watchers, costs, multimodal assets, evaluations, and rollback snapshots

## Prepared but intentionally not activated automatically
- Database migration
- Background watchers
- Autonomous work-session executor
- Multi-provider council calls
- Cross-provider model routing
- RAG embeddings/search
- Voice I/O
- Code-execution sandbox
- Automatic learning-candidate extraction
- Automatic execution of approved actions

These remain gated because they need provider adapters, scheduler/sandbox infrastructure, or explicit owner approval before enabling external side effects.
