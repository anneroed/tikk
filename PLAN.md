# Tikk – plan

En PWA som lærer klokka, fra urskiven til regning med tid. Mørk, moderne smartklokke-stil.
All data ligger i `localStorage` på enheten.

## Skjermstruktur

| Skjerm | Adresse | Innhold |
| --- | --- | --- |
| Hjem | `#/` | Hennes klokke viser tiden nå (trykk: «Hva er klokka?»), læringsløypa med 8 nivåer, snarveier til verksted og samling, lydknapp |
| Nivå – forklaring | `#/niva/2` | Kort, interaktiv forklaring i 4–6 kort, med klokke hun kan dra i. Siste kort: «Start oppgaver» |
| Oppgaverunde | `#/niva/2/oppgaver` | 5 spørsmål, fremdriftsprikker, tilbakemelding etter hvert svar, oppsummering til slutt |
| Pakke (fase 3) | inne i oppgaverunden | Etter runden: en pakke som åpnes og avslører en ny klokkedel |
| Samling (fase 3) | `#/samling` | Alle deler i rutenett, med tomme, låste plasser for det som mangler |
| Klokkeverksted (fase 3) | `#/verksted` | Sett sammen egen klokke av opplåste deler, med forhåndsvisning |
| Innstillinger | `#/innstillinger` | Lyd av/på, foreldremodus (lås opp nivåer), nullstill |
| Installer | `#/installer` | Veiledning for «Legg til på Hjem-skjerm» |

Alle skjermer unntatt Hjem har tilbakeknapp. Midt i en runde spør appen før den avslutter.

## Faser

1. **Klokka og nivå 1–2** (nå)
   PWA-skall, ruter, lagring, lyd. SVG-klokke der viserne kan dras, timeviseren følger minuttviseren,
   tikkelyd per minutt. Nivå 1 (urskiven) og 2 (hele timer) med forklaring og oppgaver av typene
   *les klokka*, *still klokka* og *trykk på urskiven*. Feil svar viser riktig svar med animasjon.
2. **Nivå 3–5: minutter, halv/kvart, over/på**
   Norsk tidsspråk («fem på halv tre»), oppgavetypene *koble analog og digital* og *hvilken er feil?*.
3. **Belønninger og klokkeverksted**
   Klokkedeler (urskiver, visere, tall, farger), pakkeåpning med unlock-lyd, samling med tomme plasser,
   sjeldne deler for innsats (rekker, flere dager), verksted. Valgt klokke brukes overalt.
4. **Nivå 6–8: sekundviser, digital og 24 timer, tid i hverdagen**
   Hverdagsoppgaver med regning mellom to klokkeslett.

   *24-timersklokka:* en analog klokke viser bare 12 timer, så frem til nivå 7 skrives tider som 1–12
   («2:30»). I nivå 7 får klokka et lite dag/natt-merke (sol, ettermiddag, måne) og en situasjon
   («Du spiser middag»), og svaret skrives digitalt med 24 timer: halv tre om ettermiddagen = 14:30.
   Regelen læres som «legg til 12 etter klokka tolv på dagen».
5. **Finpuss og publisering**
   Repetisjon av fullførte nivåer, ikoner, publisering (GitHub Pages som de andre appene).
