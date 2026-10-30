# FINO JEWELLERY — website + CMS

| Folder | What it is |
|---|---|
| `website/` | The Next.js website (cinematic necklace journey, collection, team, blog, SEO). See `website/README.md`. |
| `studio-fino-jewellery/` | Sanity Studio — the content dashboard. See `studio-fino-jewellery/README.md`. |

## Run locally

```bash
cd website && npm install && npm run dev                  # http://localhost:3000
cd studio-fino-jewellery && npm install && npm run dev    # http://localhost:3333
```

The website needs `website/.env.local`; copy `website/.env.example` and fill it in. That file is never committed.
