# Pro Tips for Antigravity + Gemini Execution
- Keep prompts <4k tokens. Use #CONTINUE for truncation.
- After every 2 tasks: run architecture review against manifest constraints.
- Fallback: If Gemini hallucinates schema → force [PRO] validation against Supabase RLS docs.
- Test-first: Generate 50 test cases BEFORE implementation.
- Never trust cloud output blindly. Run validation commands locally.
- Deploy to staging FIRST. Never push direct to production without manual E2E check.
