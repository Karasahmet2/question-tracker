# Update 5: a new version must show the first time the app is opened after the upload.
# Copies the app to a temporary folder, serves it the way GitHub Pages does (browsers may keep
# files for 10 minutes), opens it, "uploads" a new version, then opens the app again once.
# Run from the app folder:  python3 tests/t04_updates.py
import http.server, threading, functools, os, sys, shutil, tempfile, re
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = tempfile.mkdtemp(prefix='qt-site-')
for name in ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'icons', 'fonts']:
    src = os.path.join(ROOT, name)
    (shutil.copytree if os.path.isdir(src) else shutil.copy)(src, os.path.join(SITE, name))

class PagesLike(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def end_headers(self):
        self.send_header('Cache-Control', 'max-age=600')  # what GitHub Pages sends
        super().end_headers()
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(PagesLike, directory=SITE))
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{srv.server_port}/'

errors, passed = [], []
def check(name, cond):
    (passed if cond else errors).append(name)
    print(('PASS ' if cond else 'FAIL ') + name)

def bump(new):
    """Pretend to upload a new version: change both version names and one visible word."""
    for f, pat in [('index.html', r"APP_VERSION = '[^']+'"), ('sw.js', r"const VERSION = '[^']+'")]:
        p = os.path.join(SITE, f)
        s = open(p).read()
        s = re.sub(pat, pat.split('=')[0].replace('\\', '') + f"= '{new}'", s)
        open(p, 'w').write(s)
    p = os.path.join(SITE, 'js', 'app.js')
    s = open(p).read().replace('<span class="label">Up next</span>', '<span class="label">Up next</span>')
    s = re.sub(r'<div class="label">Up next[^<]*</div>', f'<div class="label">Up next {new}</div>', s)
    open(p, 'w').write(s)

with sync_playwright() as p:
    exe = '/usr/bin/google-chrome' if os.path.exists('/usr/bin/google-chrome') else None
    b = p.chromium.launch(executable_path=exe)
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    console = []
    page.on('pageerror', lambda e: console.append(str(e)))

    page.goto(URL)
    page.wait_for_selector('h1')
    page.evaluate("navigator.serviceWorker.ready")
    page.reload()
    page.wait_for_selector('h1')
    first = page.evaluate('APP_VERSION')
    check('app is controlled by the offline worker', page.evaluate('!!navigator.serviceWorker.controller'))
    # Save a try so we can see data survives the update
    page.goto(URL + '#/q/4.01'); page.wait_for_selector('.sheet')
    page.click('.opt[data-k=result][data-v="0"]'); page.click('#save')
    page.wait_for_selector('#sheet', state='hidden')

    bump('qt-test-2')
    page.goto(URL)            # open the app once after the upload
    page.wait_for_timeout(4000)
    page.wait_for_selector('h1')
    check('new version shows on the first open', page.evaluate('APP_VERSION') == 'qt-test-2')
    check('new screen text shows too', 'qt-test-2' in page.inner_text('.label').lower())
    check('update notice shown', 'Updated' in (page.inner_text('#toast') if page.locator('#toast:not([hidden])').count() else ''))
    check('saved data survived the update', '1 of 70 solved' in page.inner_text('h1'))

    bump('qt-test-3')         # and the next one
    page.goto(URL)
    page.wait_for_timeout(4000)
    page.wait_for_selector('h1')
    check('a second update also shows on the first open', page.evaluate('APP_VERSION') == 'qt-test-3')

    # Still works offline afterwards
    ctx.set_offline(True)
    page.reload()
    page.wait_for_selector('h1')
    check('works offline after updating', page.evaluate('APP_VERSION') == 'qt-test-3')
    ctx.set_offline(False)

    check('no script errors', not console)
    if console: print(console)
    print('(started at', first + ')')
    b.close()

srv.shutdown()
shutil.rmtree(SITE, ignore_errors=True)
print(f'\n{len(passed)} passed, {len(errors)} failed')
sys.exit(1 if errors else 0)
