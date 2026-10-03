# web — Next.js app

The frontend of the Małopolski Hub Innowacji Społecznych prototype.
Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui (radix base).

`node` is not on `PATH` on the dev machine (NixOS), so run everything through the dev shell from
the **repo root**:

```bash
nix-shell --run 'cd web && npm run dev'     # http://localhost:3000
nix-shell --run 'cd web && npm run lint'
nix-shell --run 'cd web && npm run build'
```

Secrets go in `web/.env.local` — copy the `web` block from [`../.env.example`](../.env.example).

- Project contract, API shapes, DB schema, accessibility rules, file ownership:
  [`../AGENTS.md`](../AGENTS.md)
- Dependencies, licences and gotchas (Tailwind v4, font subsets, NixOS):
  [`../DEPENDENCIES.md`](../DEPENDENCIES.md)
- Supabase + Vercel setup: [`../docs/setup-deploy.md`](../docs/setup-deploy.md)
