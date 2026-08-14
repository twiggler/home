# Run the Playwright layout tests inside the official container (no host Node needed).
image := "mcr.microsoft.com/playwright:v1.62.1-noble"
run := "podman run --rm -it -v " + justfile_directory() + ":/work:Z -w /work " + image

# Install deps and run the cross-browser layout tests in the container.
test *args:
    {{run}} sh scripts/run-tests.sh {{args}}

# Regenerate package-lock.json in the container after changing package.json.
lock:
    {{run}} sh -c "npm install --package-lock-only --no-update-notifier"

# Open the last HTML report from inside the container.
report:
    {{run}} sh -c "npx playwright show-report --host 0.0.0.0"

# Regenerate optimized portrait images from the source master (host ImageMagick).
images:
    magick assets/src/portrait.jpg -auto-orient -strip -crop 2132x1450+1000+700 +repage -resize 220x -quality 82 assets/portrait-header.webp
    magick assets/src/portrait.jpg -auto-orient -strip -resize 1200x -quality 82 assets/portrait-large.webp
