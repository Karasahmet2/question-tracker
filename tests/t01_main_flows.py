# Run from the app folder:  python3 tests/t01_main_flows.py
# Starts a local server, opens the app in a phone-sized Chrome and taps through the main flows.
import http.server, threading, functools, os, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, 'tests', 'shots')
os.makedirs(SHOTS, exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
handler = functools.partial(Quiet, directory=ROOT)
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
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

    check('home shows 0 of 70', '0 of 70 solved' in page.inner_text('h1'))
    check('three chapter cards', page.locator('.chapter').count() == 3)
    page.screenshot(path=f'{SHOTS}/1-home.png')

    # Log a solve from Up next
    first = page.inner_text('.next .dim.small')
    page.click('.next .btn.light')
    page.wait_for_selector('.sheet')
    check('sheet opens with guide link', '#page=' in page.get_attribute('.sheet a.btn.outline', 'href'))
    check('save button says tags before a result', page.inner_text('#save') == 'Save tags')
    page.click('.opt[data-k=result][data-v="1"]')
    page.click('.opt[data-k=diff][data-v="3"]')
    page.click('.opt[data-k=quality][data-v=ugly]')
    page.click('.opt[data-k=exam][data-v="0"]')
    check('save button counts the try', page.inner_text('#save') == 'Save try #1')
    check('hint says tomorrow for a mistake', 'tomorrow' in page.inner_text('#hint'))
    page.fill('#note', 'watch the sign')
    page.screenshot(path=f'{SHOTS}/2-sheet.png')
    page.click('#save')
    page.wait_for_selector('#sheet', state='hidden')
    check('back on home after save', page.locator('.next').count() == 1)
    check('toast with undo', page.locator('#toast #undo').count() == 1)
    check('solved count went up', '1 of 70 solved' in page.inner_text('h1'))

    # Undo then redo
    page.click('#undo')
    check('undo removes the try', '0 of 70 solved' in page.inner_text('h1'))
    check('undo also clears the tags', page.evaluate("JSON.parse(localStorage.getItem('question-tracker')).tags['4.01'].exam") is None)

    # Log via the chapter list, solved correctly
    page.click('.tab:has-text("Questions")')
    page.wait_for_selector('.qrow')
    check('chapter 4 lists 33', page.locator('.qrow').count() == 33)
    page.click('a.qrow[href="#/q/4.12"]')
    page.wait_for_selector('.sheet')
    page.click('.opt[data-k=result][data-v="0"]')
    page.click('.opt[data-k=diff][data-v="2"]')
    page.click('.opt[data-k=quality][data-v=beautiful]')
    page.click('.opt[data-k=exam][data-v="1"]')
    page.click('#save')
    page.wait_for_selector('#sheet', state='hidden')
    row = page.inner_text('a.qrow[href="#/q/4.12"]')
    check('row shows medium, x1, beautiful, likely', all(t in row for t in ['Medium', '×1', 'Beautiful', 'Likely']))

    # Back gesture closes the sheet
    page.click('a.qrow[href="#/q/4.01"]')
    page.wait_for_selector('.sheet')
    page.go_back()
    page.wait_for_selector('#sheet', state='hidden')
    check('back closes the sheet and stays in the list', page.locator('.qrow').count() == 33)

    # Filters
    page.click('.chip[data-f=loved]')
    check('beautiful filter shows 1', page.locator('.qrow').count() == 1)
    page.click('.chip[data-f=todo]')
    check('not tried filter shows 32', page.locator('.qrow').count() == 32)
    page.click('.seg:has-text("Ch 6")')
    page.wait_for_selector('h1:has-text("Time-varying")')
    page.click('.chip[data-f=all]')
    check('chapter 6 lists 16', page.locator('.qrow').count() == 16)
    page.click('.chip[data-f=all]')

    # Map modes
    page.click('.tab:has-text("Map")')
    page.wait_for_selector('.tile')
    check('map has 70 tiles', page.locator('.tiles .tile').count() == 70)
    check('4.12 is medium in difficulty mode', 'd2' in page.get_attribute('a.tile[href="#/q/4.12"]', 'class'))
    check('4.12 has likely ring and star', page.locator('a.tile[href="#/q/4.12"] .ring').count() == 1 and page.locator('a.tile[href="#/q/4.12"] .star').count() == 1)
    page.screenshot(path=f'{SHOTS}/3-map-difficulty.png')
    page.click('.segbtn[data-m=result]')
    check('4.12 is blue in result mode', 'r1' in page.get_attribute('a.tile[href="#/q/4.12"]', 'class'))
    page.click('.segbtn[data-m=exam]')
    check('4.12 is likely colour in exam mode, no ring', 'e2' in page.get_attribute('a.tile[href="#/q/4.12"]', 'class') and page.locator('a.tile .ring').count() == 0)
    page.screenshot(path=f'{SHOTS}/4-map-exam.png')
    page.reload()
    page.wait_for_selector('.tile')
    check('map mode is remembered', 'on' in page.get_attribute('.segbtn[data-m=exam]', 'class'))
    check('data survives reload', 'e2' in page.get_attribute('a.tile[href="#/q/4.12"]', 'class'))

    # Opening straight on a question, then closing, lands on its chapter
    page.goto(URL + '#/q/5.03')
    page.reload()
    page.wait_for_selector('.sheet')
    page.click('.scrim', position={'x': 20, 'y': 20})
    page.wait_for_selector('#sheet', state='hidden')
    check('direct link closes to its chapter', 'Magnetostatics' in page.inner_text('h1'))

    # Backup round trip
    page.goto(URL + '#/settings')
    page.wait_for_selector('#export')
    with page.expect_download() as d:
        page.click('#export')
    path = d.value.path()
    data = open(path).read()
    check('backup holds the try', '"4.12"' in data)
    page.evaluate("localStorage.clear()")
    page.set_input_files('#import', path)
    page.wait_for_timeout(300)
    page.goto(URL + '#/')
    page.wait_for_selector('h1')
    check('restore brings it back', '1 of 70 solved' in page.inner_text('h1'))

    check('no script errors', not console)
    if console: print(console)
    b.close()

srv.shutdown()
print(f'\n{len(passed)} passed, {len(errors)} failed')
sys.exit(1 if errors else 0)
