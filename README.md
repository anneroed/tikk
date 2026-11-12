# Tikk

PWA som lærer å lese klokka: fra urskiven og hele timer til «fem på halv tre», sekunder, 24-timersklokka
og regning med tid i hverdagen. Laget for iPhone (Legg til på Hjem-skjerm), med norsk tekst overalt.
All fremdrift ligger lokalt på enheten (localStorage). Se [PLAN.md](PLAN.md) for skjermer og faser.

```bash
npm start   # http://localhost:4174
npm test
```

## Innhold

- **Læringsløype** med 8 nivåer som låses opp etter hverandre (4 av 5 riktige). Hvert nivå har en kort,
  interaktiv forklaring og runder på 5 oppgaver fra lett til vanskeligere.
- **Klokka** (`js/clock.js`) er SVG der viserne kan dras. Tiden er ett tall i minutter, så timeviseren
  følger minuttviseren automatisk. Med sekundviser hopper minuttviseren hele minutter.
- **Øvingsrom** med blandede runder på 10 oppgaver. Nivåer med mange feil kommer oftere.
- **Belønninger** (`js/parts.js`): 37 klokkedeler. De beste for å fullføre nivåer, pakker etter runder
  (bare fra nivået som spilles, så det ikke lønner seg å repetere lette nivåer), og sjeldne deler for innsats.
  Samling med tomme plasser og klokkeverksted.
- **Foreldremodus** i Innstillinger låser opp alle nivåer (ikke delene).

## Publisering

Publiseres med GitHub Pages fra `main`, som de andre appene.

- Øk `VERSION` i `sw.js` ved hver publisering, ellers får ikke installerte apper den nye koden.
- Nye filer må legges i `PRECACHE` i `sw.js`. Testene feiler hvis listen ikke stemmer.
- Ikonene lages med `python3 tools/make_icons.py`.
