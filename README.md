# Tikk

PWA som lærer å lese klokka: fra urskiven og hele timer til «fem på halv tre», digital tid og regning med tid.
All fremdrift ligger lokalt på enheten (localStorage). Se [PLAN.md](PLAN.md) for skjermer og faser.

```bash
npm start
```

Åpne http://localhost:4174. Testene kjøres med `npm test`.

- Ved publisering: øk `VERSION` i `sw.js`, ellers får ikke installerte apper den nye koden.
- Nye filer må legges i `PRECACHE` i `sw.js`. Testene feiler hvis listen ikke stemmer.
- Ikonene lages med `python3 tools/make_icons.py`.
- Foreldremodus i Innstillinger låser opp alle nivåer, nyttig for testing.
