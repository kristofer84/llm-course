# LLM-kurs: från noll till expert

Interaktiv kurs i en enda självständig HTML-fil (`llm-kurs.html`), byggd från delfiler i `src/`.

## Bygga
    cd src && python3 build.py      # skriver ../llm-kurs.html

## Språk (i18n)
Kursen är tvåspråkig i samma fil: svenska (källspråk) och engelska, med språkväxlare i toppfältet.
Valet sparas i `localStorage`, `?lang=sv` / `?lang=en` overrider, och `<html lang>` uppdateras.
Första besöket följer webbläsarens språk: svenska för svenska läsare, annars engelska.

Motorn är [i18next](https://www.i18next.com/), vendorad i `src/vendor/i18next.min.js` och inlinad i bygget
(sidan är fortfarande en enda offline-fil). Den svenska strängen är själv nyckeln, så källfilerna
innehåller inga nycklar:

- `src/i18n/engine.js` – init, `L.t()`, `L.num()`, DOM-applicering och språkväxlaren.
- `src/i18n/en/*.json` – engelska kataloger: `{"svensk sträng": "english string"}`.
  `data.json` är medvetna identitetsmappningar: svenska exempeltokens som `katt`, `satt`,
  `mattan` är data som diagrammen ritas av och ska stå kvar även i engelskt läge.
  Nycklarna är explicita (`p3.rmsnorm.2`, `j6.12`, `mod.3.name`), källfilerna innehåller
  markering men ingen text: `<p data-i18n="p3.rmsnorm.2"></p>. Bygget fyller i svenskan
  statiskt, så den färdiga filen går att läsa även utan JavaScript.
- `src/i18n/GLOSSARY.md` – terminologi och regler för översättning.
- `tools/check_i18n.py` – statisk kontroll av kompletthet, inline-markup, platshållare och siffror.
  Ingen webbläsare behövs.

### Redigera texten

Källfilerna innehåller markering, inte text. För att läsa och ändra kursens text finns ett
mellanlager: en Markdown-fil per grupp, i den ordning kursen visar den, med nyckeln över varje
block och svenska och engelska sida vid sida.

    python3 tools/content.py dump          # -> src/i18n/edit/<grupp>.md (genererat, ej i git)
    $EDITOR src/i18n/edit/p3.md            # ändra raderna som börjar med SV| (och EN|)
    python3 tools/content.py apply         # tillbaka in i katalogerna
    (cd src && python3 build.py)           # bygg om
    python3 tools/check_i18n.py            # kontrollera

Ett block ser ut så här — nyckeln överst, sedan en rad per textrad:

    @@ p3.rmsnorm.6
    ## RMSNorm  [p]

    SV| Division med RMS bevarar riktningen och bestämmer storleken. ...
    EN| Division by the RMS preserves the direction and sets the size. ...

Inbäddad markup (`<b>`, `<span class="mk">`) och `{{platshållare}}` måste stå kvar; det kontrolleras
av `check_i18n.py`. Formelblock behåller sina radbrytningar som flera `SV|`-rader.

`apply` skriver också ner vilken svensk text varje engelsk rad översattes från, i
`src/i18n/.translation-state.json`. Sedan syns det som annars tystnar:

    python3 tools/content.py status        # nycklar där engelskan är på efterkälken
    python3 tools/content.py status --strict   # samma, men exit-kod 1

Vill du lägga till en rad som inte finns: skriv `@@ <grupp>.<slug>.<n> - new` med en ledig nyckel,
fyll i `SV|` och `EN|`, kör `apply` — och lägg in `<p data-i18n="..."></p>` på rätt plats i
`src/<grupp>.html` (annars varnar `check_i18n.py` om en oanvänd nyckel).

Lägga till ett språk, t.ex. tyska: skapa `src/i18n/de/` med samma sorts filer (en per grupp), fyll i
översättningarna och bygg. Språkväxlaren får knappen automatiskt. Saknade nycklar faller tillbaka på
svenska, och `tests/i18n.py` failar om det engelska läget visar svensk text.

## Publicera
Sidan byggs och publiceras av GitHub Actions (`.github/workflows/pages.yml`):
`test`-jobbet bygger filen och kör Playwright-testerna, `build` kopierar `llm-kurs.html` till
`_site/index.html` och `deploy` laddar upp den som GitHub Pages-artefakt. Körs vid push till
`main` och som test vid pull requests (då utan deploy).

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
    python3 -m pip install -r tests/requirements.txt
    python3 -m playwright install chromium
    python3 tests/smoke.py            # CI-gate: slides, overflow, JS-fel, quiz, interaktiva element
    python3 tests/test.py             # klickar igenom alla slides, skriver skärmbilder till shots/
    python3 tests/i18n.py             # tvåspråkighet: katalogtäckning, växlare, ingen svenska i EN-läget

Arbetsflöde för översättning:

    (cd src && python3 build.py)      # bygg först: extraktionen läser den byggda sidan
    python3 tools/content.py status   # engelska på efterkälken?
    python3 tools/check_i18n.py       # täckning + markup + platshållare + siffror per grupp
    python3 tools/check_i18n.py --group m3

`tests/test2.py`–`test7.py` är manuella granskningsskript (skärmbilder per vy). Alla skript
läser `llm-kurs.html` relativt repo-roten; `COURSE_HTML` och `COURSE_SHOTS` overrider sökvägarna,
så de kan köras från valfri katalog och även mot den publicerade sidan.
