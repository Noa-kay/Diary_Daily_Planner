import fs from 'fs';
import path from 'path';

try {
  const distDir = path.resolve('dist');
  const indexHtmlPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    console.log('dist/index.html not found, skipping standalone generation');
    process.exit(0);
  }

  const html = fs.readFileSync(indexHtmlPath, 'utf8');

  // Find css file
  const cssMatch = html.match(/href="(\/assets\/[^"]+\.css)"/);
  // Find js file
  const jsMatch = html.match(/src="(\/assets\/[^"]+\.js)"/);

  if (!cssMatch || !jsMatch) {
    console.warn('Could not locate css or js assets in dist/index.html');
    process.exit(0);
  }

  const cssPath = path.join(distDir, cssMatch[1]);
  const jsPath = path.join(distDir, jsMatch[1]);

  const css = fs.readFileSync(cssPath, 'utf8');
  const js = fs.readFileSync(jsPath, 'utf8');

  let single = html
    .replace(/<link rel="stylesheet"[^>]+href="\/assets\/[^"]+\.css"[^>]*>/, `<style>\n${css}\n</style>`)
    .replace(/<script type="module"[^>]+src="\/assets\/[^"]+\.js"[^>]*><\/script>/, `<script>\n${js}\n</script>`)
    .replace(/<link rel="manifest"[^>]*>/, '')
    .replace(/<script id="vite-plugin-pwa:register-sw"[^>]*><\/script>/, '');

  // Add initial data placeholder injection hook before root
  single = single.replace(
    '<div id="root"></div>',
    `<script>
      try {
        if (window.__STANDALONE_EMBEDDED_DATA__ && !localStorage.getItem('offline_personal_journal_v1')) {
          localStorage.setItem('offline_personal_journal_v1', JSON.stringify(window.__STANDALONE_EMBEDDED_DATA__));
        }
      } catch (e) {
        console.warn('Auto-init localStorage error:', e);
      }
    </script>
    <div id="root"></div>`
  );

  // Write to public/ and dist/
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public', { recursive: true });
  }
  fs.writeFileSync(path.resolve('public/standalone-planner.html'), single);
  fs.writeFileSync(path.resolve('dist/standalone-planner.html'), single);

  console.log('✅ Generated standalone-planner.html successfully! (' + (single.length / 1024).toFixed(1) + ' KB)');
} catch (err) {
  console.error('Error generating standalone planner:', err);
}
