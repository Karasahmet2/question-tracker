# Question Tracker

A phone app for working through the 70 exam-pool questions in the EM Midterm 2 study guides
(Chapter 4: 33, Chapter 5: 21, Chapter 6: 16). It installs from the browser, works offline,
and keeps your ratings on the phone.

## Screens

| Address | Screen |
|---|---|
| `#/` | Home: progress, **Up next** (with Skip) and the three chapters |
| `#/ch/4` | Chapter list with filters (Due now, Not tried, On the exam, Hard +, Got stuck, Ugly, Beautiful) and sort |
| `#/q/4.12` | Log a try: result, difficulty, how the question is, exam chance, a note, and earlier tries |
| `#/map` | All 70 tiles, coloured by Difficulty, Last result or Exam chance |
| `#/settings` | Theme, backup and restore |

## Question types

Each question is an **Example**, **Homework** or **Recitation** question (35 / 19 / 16), read from its source in the guide.
The type button — top right on Home, next to Sort in the list, beside the subtitle on the map — opens a small menu
where you tick any combination. The choice applies to all screens at once:

- **Home** counts, stats, chapter cards and Up next use only the ticked types.
- **The list** shows only those types, and the chip filters work on top of them.
- **The map** keeps all 70 tiles in place and fades the other types, so the layout never jumps.

The button reads *All types*, one name (*Homework*) or a short mix (*Ex + Rec*), and turns the theme colour while
anything is left out. Ticking all three is the same as *Show all types*. Tap outside the menu or press Escape to close it.
The choice is remembered. List rows show a short source such as “Ex 4-1”, “HW5 Q1” or “Rec 4 · P4.18”.

## What gets saved

- **A try** is saved when you pick a **Result** (Solved correctly, Made a mistake, Stuck, Couldn't solve),
  with an optional **Difficulty** (Easy, Medium, Hard, Very hard) and note.
  Without a result, Save only updates the tags.
- **Tags** belong to the question and keep their latest value: how it is (Beautiful, Nice, OK, Ugly, Disgusting)
  and exam chance (D-Yes, Likely, Maybe, Hardly, D-No).
- Each save shows an Undo for 5 seconds. A single try can be deleted from its history, also with Undo.

## How Up next is chosen

When a question comes back depends on the last try:
Solved correctly: Easy 7 days, Medium 5, Hard 3, Very hard 2. Made a mistake: 1 day. Stuck or Couldn't solve: the same day.

Among questions that are due, the order is set by exam chance first
(D-Yes > Likely > Maybe/unrated > Hardly > D-No), then by a bad last result,
a higher difficulty and how long it has been overdue. Questions never tried count as due.

## Themes

Settings → Theme: **Auto** (Light by day, Night when the phone is in dark mode), **Light**, **Paper**, **Forest** and **Night**.
Every colour, including the map scales, comes from the theme variables at the top of `css/style.css`.
Headings use Bricolage Grotesque and text uses Inter; both are in `fonts/`, so they work offline (SIL Open Font License).

## Study guide PDFs

"Open guide" opens `guides/EM_C4_Study_Guide.pdf#page=N` (and C5, C6). Put the three PDFs in a
`guides/` folder next to `index.html` with exactly those names. **If the GitHub repository is public,
the PDFs will be public too.** Leave them out if you'd rather not share them; the rest of the app
works without them. Every question still shows its page number.

## Files

| File | What it does |
|---|---|
| `index.html` | Loads the styles and scripts; `APP_VERSION` is set here |
| `js/questions.js` | The 70 questions: number, source, title, page; types and short sources are worked out here |
| `js/db.js` | Saved data in localStorage, backup and restore, migrations |
| `js/logic.js` | Labels, state of each question, Up next order |
| `js/app.js` | Screens and navigation |
| `css/style.css` | All styles; the themes and map colour scales are at the top |
| `fonts/` | Inter and Bricolage Grotesque |
| `sw.js` | Offline files; change `VERSION` with every update |
| `tests/t01_main_flows.py` | Main flows (28 checks) |
| `tests/t02_ratings_and_themes.py` | Update 2: new ratings, old data carried over, themes (24 checks) |
| `tests/t03_question_types.py` | Updates 3–4: type menu on every screen, two types at once, narrow phones (39 checks) |
| `tests/t04_updates.py` | Update 5: a new upload shows on the first open, data kept, still offline (8 checks) |

## Updates

| Version | What it brought |
|---|---|
| qt-v5 | Updates now show the first time the app opens after an upload, with an “Updated” notice. Fixes stale files being stored from the browser’s short-term cache. |
| qt-v4 | Type menu with checkboxes: pick two (or any) types at once. A single type saved by v3 carries over. |
| qt-v3 | Type button: Examples, Homework, Recitation on Home, list and map. Short sources on list rows. |
| qt-v2 | Five-step question rating (Beautiful … Disgusting), exam names D-Yes … D-No, new look, themes. Saved “Normal” ratings become “OK”. |
| qt-v1 | First version |

## Updating

1. Change `VERSION` in `sw.js` and `APP_VERSION` in `index.html` together (`qt-v6`, …).
2. Upload the changed files to the repository and wait for GitHub Pages to publish (usually 1–2 minutes;
   the repository's **Actions** tab shows a green tick when it's live).
3. Open the app. It finds the new version, reloads once by itself and shows **“Updated to qt-v…”**.
   If the app was already open in the background, bringing it to the front does the same.

**Which version am I on?** Settings → bottom line, e.g. *Question Tracker · qt-v5*.

**Still on the old version?** Close the app fully (swipe it away from recent apps) and open it again.
Updates from **qt-v4 or older to qt-v5** may need this once, because those versions didn't know how to switch
over by themselves; from qt-v5 on it happens automatically.

Run the tests with `python3 tests/t01_main_flows.py`, `t02_ratings_and_themes.py`, `t03_question_types.py`
and `t04_updates.py` (needs Python Playwright and Chrome).
