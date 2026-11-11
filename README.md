# LLM-kurs: från noll till expert

Interaktiv kurs i en enda självständig HTML-fil (`llm-kurs.html`), byggd från delfiler i `src/`.

## Bygga
    cd src && python3 build.py      # skriver ../llm-kurs.html

## Publicera
Sidan byggs och publiceras av GitHub Actions (`.github/workflows/pages.yml`) vid varje push till `main`:
`src/build.py` körs, `llm-kurs.html` kopieras till `_site/index.html` och laddas upp som GitHub Pages-artefakt.

Repo: https://github.com/kristofer84/llm-course — sida: https://kristofer84.github.io/llm-course/

## Struktur (src/)
- `build.py` – modulordning (ORDER), modulmetadata (MODS: mål, sammanfattningar, tider), sätter ihop allt. Genererar modulöppnare, sammanfattningar och nivå (data-level).
- `leads.py` – klartext-ingress per slide (LEADS) och nivåindelning (L1 grund, L3 expert, övrigt fördjupning).
- `p1.html` – head, all CSS, toppfält. `p9.html` – sidfot, innehålls- och ordlistepanel.
- `p2–p8.html` – ursprungliga slides (moduler), `n*.html` – senare tillagda slides. Slides hittas via `data-title`; ordningen bestäms helt av ORDER i build.py.
- `j0.js` – motor: navigering, nivåfilter, progress/localStorage, quizkomponent.
- `jd.js` – data: QUIZ (frågor per modul + slutprov) och GLOSS (ordlista).
- `j1b.js, j2b.js, j3.js … j8.js` – interaktiva visualiseringar, en IIFE per slide, adresserade via element-id.
- `jz.js` – init och avslutande taggar.

## Konventioner
- Färger: --w vikter, --a aktiveringar, --kv KV-cache, --tok tokens. Ljust/mörkt tema via CSS-variabler.
- Referensmodell: Llama-3-8B (d=4096, L=32, n_h=32, n_kv=8, d_h=128, d_ff=14336, V=128256).
- Shapes skrivs [d_in, d_out] i flödesriktning (PyTorch lagrar [out, in]).
- Svenska med engelska facktermer, svenska citattecken ” ”.

## Testa
`tests/` innehåller Playwright-skript som renderar alla slides och klickar igenom interaktiva delar (sökvägar kan behöva justeras).
