#!/usr/bin/env ruby
# Renders the built homepage (dist/index.html) to a PDF using headless
# Chromium, so the downloadable CV is always an exact copy of what's on
# the site. Run AFTER `jekyll build` — needs dist/ to exist, and writes
# straight into dist/assets/ since Jekyll already built that directory.
#
# Serves dist/ over local HTTP (rather than pointing Chrome at a file://
# URL) because the page's CSS/asset links are root-absolute (e.g.
# "/assets/css/main.css") — under file://, "/" resolves to the filesystem
# root, not the site, so the page would lose all styling.

require "webrick"

ROOT = File.expand_path("../..", __dir__)
SITE_DIR = File.join(ROOT, "dist")
OUTPUT = File.join(SITE_DIR, "assets", "ziga-hvalec-cv.pdf")
PORT = 4021

CHROME_CANDIDATES = [
  ENV["CHROME_PATH"],
  "chromium",
  "chromium-browser",
  "google-chrome",
  "google-chrome-stable",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].compact

def find_chrome
  CHROME_CANDIDATES.find do |candidate|
    candidate.include?("/") ? File.executable?(candidate) : system("which #{candidate} > /dev/null 2>&1")
  end
end

chrome = find_chrome
unless chrome
  warn "No Chrome/Chromium binary found (checked: #{CHROME_CANDIDATES.join(', ')}). Skipping CV PDF generation."
  exit 0
end

unless Dir.exist?(SITE_DIR)
  abort "#{SITE_DIR} doesn't exist — run `bundle exec jekyll build` before this script."
end

server = WEBrick::HTTPServer.new(
  Port: PORT,
  DocumentRoot: SITE_DIR,
  Logger: WEBrick::Log.new(File::NULL),
  AccessLog: [],
)
server_thread = Thread.new { server.start }
sleep 0.5 # give WEBrick a moment to bind before Chrome connects

begin
  ok = system(
    chrome,
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--no-pdf-header-footer",
    "--print-to-pdf=#{OUTPUT}",
    "http://127.0.0.1:#{PORT}/",
  )
  abort "Chrome failed to generate the PDF" unless ok
ensure
  server.shutdown
  server_thread.join
end

unless File.exist?(OUTPUT) && File.size(OUTPUT) > 0
  abort "Chrome exited cleanly but #{OUTPUT} was never written"
end

puts "Generated #{OUTPUT}"
