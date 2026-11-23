# Update 2: five-step question rating, new exam labels, old data carried over, themes.
# Run from the app folder:  python3 tests/t02_ratings_and_themes.py
import http.server, threading, functools, os, sys, json
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, 'tests', 'shots')
os.makedirs(SHOTS, exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=ROOT))
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{srv.server_port}/'

errors, passed = [], []
def check(name, cond):
    (passed if cond else errors).append(name)
    print(('PASS ' if cond else 'FAIL ') + name)

# Saved data as version 1 of the app left it.
V1 = {'v': 1, 'attempts': [
    {'id': 'a1', 'q': '4.12', 'at': '2026-11-18T10:00:00.000Z', 'result': 1, 'diff': 3, 'note': 'sign!'},
    {'id': 'a2', 'q': '5.03', 'at': '2026-11-20T10:00:00.000Z', 'result': 0, 'diff': 1, 'note': ''}],
    'tags': {'4.12': {'quality': 'normal', 'exam': 0}, '5.03': {'quality': 'ugly', 'exam': 2}},
    'prefs': {'mapMode': 'diff', 'lastCh': 4}}

with sync_playwright() as p:
    exe = '/usr/bin/google-chrome' if os.path.exists('/usr/bin/google-chrome') else None
    b = p.chromium.launch(executable_path=exe)
    page = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True)
    console = []
    page.on('pageerror', lambda e: console.append(str(e)))
    page.goto(URL)
    page.evaluate("d => localStorage.setItem('question-tracker', JSON.stringify(d))", V1)
    page.reload()
    page.wait_for_selector('h1')

    saved = page.evaluate("JSON.parse(localStorage.getItem('question-tracker'))")
    check('old data kept: 2 tries, 2 solved', '2 of 70 solved' in page.inner_text('h1') and len(saved['attempts']) == 2)
    check('"normal" became "ok"', saved['tags']['4.12']['quality'] == 'ok')
    check('data marked version 2', saved['v'] == 2)
    check('up next exam pill says D-Yes', 'D-Yes' in page.inner_text('.next'))
    page.screenshot(path=f'{SHOTS}/v2-home-light.png')

    # Sheet: 5 rating options, 5 exam options with new names
    page.goto(URL + '#/q/5.03')
    page.wait_for_selector('.sheet')
    qopts = page.locator('.opt[data-k=quality]').all_inner_texts()
    eopts = page.locator('.opt[data-k=exam]').all_inner_texts()
    check('rating options', qopts == ['Beautiful', 'Nice', 'OK', 'Ugly', 'Disgusting'])
    check('exam options', eopts == ['D-Yes', 'Likely', 'Maybe', 'Hardly', 'D-No'])
    check('saved tags are preselected', 'on' in page.get_attribute('.opt[data-k=quality][data-v=ugly]', 'class') and 'on' in page.get_attribute('.opt[data-k=exam][data-v="2"]', 'class'))
    page.click('.opt[data-k=quality][data-v=disgusting]')
    page.click('.opt[data-k=exam][data-v="1"]')
    page.screenshot(path=f'{SHOTS}/v2-sheet-light.png')
    page.click('#save')
    page.wait_for_selector('#sheet', state='hidden')
    t = page.evaluate("JSON.parse(localStorage.getItem('question-tracker')).tags['5.03']")
    check('tags saved without counting a try', t == {'quality': 'disgusting', 'exam': 1} and page.evaluate("JSON.parse(localStorage.getItem('question-tracker')).attempts.length") == 2)

    page.goto(URL + '#/q/4.03')
    page.wait_for_selector('.sheet')
    page.click('.opt[data-k=result][data-v="0"]')
    page.click('.opt[data-k=quality][data-v=nice]')
    page.click('#save')
    page.wait_for_selector('#sheet', state='hidden')

    # List filters and map marks
    page.goto(URL + '#/ch/5')
    page.wait_for_selector('.qrow')
    page.click('.chip[data-f=disliked]')
    check('Ugly / Disgusting filter finds 5.03', page.locator('.qrow').count() == 1 and 'Disgusting' in page.inner_text('.qrow'))
    page.click('.chip[data-f=all]')
    page.goto(URL + '#/ch/4')
    page.wait_for_selector('.qrow')
    page.click('.chip[data-f=loved]')
    check('Beautiful / Nice filter finds 4.03', page.locator('.qrow').count() == 1 and 'Nice' in page.inner_text('.qrow'))
    page.click('.chip[data-f=all]')
    page.screenshot(path=f'{SHOTS}/v2-list-light.png')
    page.goto(URL + '#/map')
    page.wait_for_selector('.tile')
    check('disgusting tile has a cross', page.locator('a.tile[href="#/q/5.03"] .cross').count() == 1)
    check('nice tile has an open star', page.locator('a.tile[href="#/q/4.03"] .star.open').count() == 1)
    check('ok tile has no mark', page.locator('a.tile[href="#/q/4.12"] .star, a.tile[href="#/q/4.12"] .slash, a.tile[href="#/q/4.12"] .cross').count() == 0)
    check('legend uses new exam names', 'D-Yes' in page.inner_text('.legend'))

    # Themes
    page.goto(URL + '#/settings')
    page.wait_for_selector('.theme')
    check('five theme choices', page.locator('.theme').count() == 5)
    for t in ['paper', 'forest', 'night']:
        page.click(f'.theme[data-t={t}]')
        check(f'{t} theme applied', page.evaluate('document.documentElement.dataset.theme') == t)
        for name, h in [('home', '#/'), ('list', '#/ch/4'), ('map', '#/map')]:
            page.goto(URL + h)
            page.wait_for_selector('.tabs')
            page.screenshot(path=f'{SHOTS}/v2-{name}-{t}.png')
        page.goto(URL + '#/q/4.12')
        page.wait_for_selector('.sheet')
        page.screenshot(path=f'{SHOTS}/v2-sheet-{t}.png')
        page.goto(URL + '#/settings')
        page.wait_for_selector('.theme')
    page.reload()
    page.wait_for_selector('.theme')
    check('theme remembered after reload', page.evaluate('document.documentElement.dataset.theme') == 'night')
    bg = page.evaluate("getComputedStyle(document.body).backgroundColor")
    check('night background is dark', bg == 'rgb(15, 17, 21)')

    # Auto follows the phone
    page.click('.theme[data-t=auto]')
    page.emulate_media(color_scheme='dark')
    page.wait_for_timeout(100)
    check('auto goes dark with the phone', page.evaluate('document.documentElement.dataset.theme') == 'night')
    page.emulate_media(color_scheme='light')
    page.wait_for_timeout(100)
    check('auto goes light with the phone', page.evaluate('document.documentElement.dataset.theme') == 'light')

    check('fonts load', page.evaluate("document.fonts.check('700 20px Bricolage') && document.fonts.check('16px Inter')"))
    check('no script errors', not console)
    if console: print(console)
    b.close()

srv.shutdown()
print(f'\n{len(passed)} passed, {len(errors)} failed')
sys.exit(1 if errors else 0)
