# Update 3: the type button (All types / Examples / Homework / Recitation) on Home, list and map.
# Run from the app folder:  python3 tests/t03_question_types.py
import http.server, threading, functools, os, sys
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

with sync_playwright() as p:
    exe = '/usr/bin/google-chrome' if os.path.exists('/usr/bin/google-chrome') else None
    b = p.chromium.launch(executable_path=exe)
    page = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True)
    console = []
    page.on('pageerror', lambda e: console.append(str(e)))
    page.goto(URL)
    page.wait_for_selector('h1')

    counts = page.evaluate("['ex','hw','rec'].map(t => QUESTIONS.filter(q => q.type === t).length)")
    check('every question has a type: 35 / 19 / 16', counts == [35, 19, 16])
    shorts = page.evaluate("['4.01','4.05','4.12','4.15','4.17','4.32'].map(id => QUESTIONS.find(q => q.id === id).short)")
    check('short sources read well', shorts == ['Ex 4-1', 'Rec 4 · P4.18', 'HW5 Q1', 'Rec 3 & 4 · P4.39', 'Rec 3', 'HW4 Q6 / HW5 Q4'])
    check('button starts on All types', page.inner_text('.typepick > span') == 'All types' and 'on' not in page.get_attribute('.typepick', 'class'))

    # Home
    page.select_option('.typeselect', 'hw')
    page.wait_for_selector('.typepick.on')
    check('home counts homework only', 'of 19 solved' in page.inner_text('h1'))
    check('up next is a homework question', page.inner_text('.next .dim.small').split('·')[1].strip().startswith('HW'))
    nums = page.locator('.chapter .num').all_inner_texts()
    check('chapter cards count homework (9, 6, 4)', [n.split('/')[1].strip() for n in nums] == ['9', '6', '4'])
    for i in range(4):
        page.click('#skip')
        if not page.inner_text('.next .dim.small').split('·')[1].strip().startswith('HW'):
            break
    check('skipping stays inside homework', page.inner_text('.next .dim.small').split('·')[1].strip().startswith('HW'))
    page.screenshot(path=f'{SHOTS}/v3-home-hw.png')

    # The choice carries to the list
    page.click('.tab:has-text("Questions")')
    page.wait_for_selector('.qrow')
    check('list remembers homework', page.inner_text('.typepick > span') == 'Homework' and page.locator('.qrow').count() == 9)
    check('list header names the type', '9 homework' in page.inner_text('header'))
    page.select_option('.typeselect', 'rec')
    page.wait_for_selector('.qrow')
    check('recitation in chapter 4 shows 7', page.locator('.qrow').count() == 7)
    check('rows show the short source', 'Rec 4 · P4.18' in page.inner_text('a.qrow[href="#/q/4.05"]'))
    page.click('.chip[data-f=todo]')
    check('type and chip filters combine', page.locator('.qrow').count() == 7)
    page.click('.chip[data-f=hard]')
    check('empty message when nothing matches', 'Nothing here' in page.inner_text('main'))
    page.click('.chip[data-f=all]')
    page.click('.seg:has-text("Ch 6")')
    page.wait_for_selector('h1:has-text("Time-varying")')
    check('chapter 6 recitation shows 4', page.locator('.qrow').count() == 4)
    page.screenshot(path=f'{SHOTS}/v3-list-rec.png')

    # Map: other types fade, grid keeps its shape
    page.click('.tab:has-text("Map")')
    page.wait_for_selector('.tile')
    check('map keeps all 70 tiles', page.locator('.tiles .tile').count() == 70)
    check('54 tiles faded', page.locator('.tiles .tile.off').count() == 54)
    check('map says others are faded', 'faded' in page.inner_text('header'))
    check('map chapter count scoped', '0 / 7 solved' in page.inner_text('.mapch'))
    page.screenshot(path=f'{SHOTS}/v3-map-rec.png')

    # Back to all, remembered after reload
    page.select_option('.typeselect', 'ex')
    page.reload()
    page.wait_for_selector('.tile')
    check('choice survives reload', page.inner_text('.typepick > span') == 'Examples' and page.locator('.tiles .tile.off').count() == 35)
    page.select_option('.typeselect', 'all')
    page.wait_for_selector('.typepick:not(.on)')
    check('all types: nothing faded', page.locator('.tiles .tile.off').count() == 0)
    page.goto(URL + '#/')
    page.wait_for_selector('h1')
    check('home back to 70', 'of 70 solved' in page.inner_text('h1'))
    page.screenshot(path=f'{SHOTS}/v3-home-all.png')

    # Fits on a narrow phone without overflowing sideways
    page.set_viewport_size({'width': 340, 'height': 740})
    for h in ['#/', '#/ch/4', '#/map']:
        page.goto(URL + h)
        page.wait_for_selector('.tabs')
        w = page.evaluate('document.documentElement.scrollWidth')
        check(f'no sideways scroll at 340px on {h}', w <= 340)

    check('no script errors', not console)
    if console: print(console)
    b.close()

srv.shutdown()
print(f'\n{len(passed)} passed, {len(errors)} failed')
sys.exit(1 if errors else 0)
