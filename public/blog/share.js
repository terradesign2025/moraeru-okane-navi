// もらえるお金ナビ ブログ記事 シェアボタン自動挿入
(function () {
  const pageUrl = encodeURIComponent(location.href);
  const pageTitle = encodeURIComponent(
    document.title.replace(/｜.*$/, '').trim()
  );
  const tags = encodeURIComponent('もらえるお金ナビ,補助金');

  // ===== CSS =====
  const style = document.createElement('style');
  style.textContent = [
    '.share-section{background:#f0f7ff;border-top:1px solid #dbeafe;padding:32px 0;}',
    '.share-section .container{max-width:800px;margin:0 auto;padding:0 20px;text-align:center;}',
    '.share-title{font-size:15px;font-weight:900;color:#1e3a5f;margin-bottom:6px;}',
    '.share-sub{font-size:12px;color:#6b7280;margin-bottom:18px;line-height:1.6;}',
    '.share-buttons{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:14px;}',
    '.share-btn{display:inline-flex;align-items:center;gap:7px;padding:11px 20px;border-radius:10px;font-weight:700;font-size:13px;text-decoration:none;transition:opacity .2s;}',
    '.share-btn:hover{opacity:.85;}',
    '.share-x{background:#000;color:#fff;}',
    '.share-line{background:#06c755;color:#fff;}',
    '.share-fb{background:#1877f2;color:#fff;}',
    '.share-mediakit{display:inline-block;margin-top:4px;font-size:11px;color:#2563eb;font-weight:700;text-decoration:none;border:1px solid #bfdbfe;border-radius:8px;padding:7px 14px;background:#fff;}',
    '.share-mediakit:hover{background:#eff6ff;}',
  ].join('');
  document.head.appendChild(style);

  // ===== DOM構築（innerHTML不使用） =====
  function makeShareBtn(href, cls, svgPath, label) {
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'share-btn ' + cls;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', svgPath);
    svg.appendChild(path);

    a.appendChild(svg);
    a.appendChild(document.createTextNode(' ' + label));
    return a;
  }

  const section = document.createElement('section');
  section.className = 'share-section';

  const container = document.createElement('div');
  container.className = 'container';

  const titleEl = document.createElement('p');
  titleEl.className = 'share-title';
  titleEl.textContent = '📣 この記事をシェアする';

  const subEl = document.createElement('p');
  subEl.className = 'share-sub';
  subEl.textContent = '知らないと損する補助金情報。ぜひ友人・家族にも教えてあげてください。';

  const buttons = document.createElement('div');
  buttons.className = 'share-buttons';

  buttons.appendChild(makeShareBtn(
    'https://twitter.com/intent/tweet?text=' + pageTitle + '&url=' + pageUrl + '&hashtags=' + tags,
    'share-x',
    'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.74-8.855L1.254 2.25H8.08l4.253 5.622 5.892-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    'Xでシェア'
  ));

  buttons.appendChild(makeShareBtn(
    'https://social-plugins.line.me/lineit/share?url=' + pageUrl,
    'share-line',
    'M24 10.304c0-5.369-5.383-9.738-12-9.738S0 4.935 0 10.304c0 4.813 4.269 8.842 10.035 9.607.391.085.924.259 1.058.594.121.305.079.785.038 1.094l-.172 1.031c-.053.305-.242 1.191 1.043.65 1.285-.542 6.938-4.087 9.469-6.997C23.204 14.136 24 12.31 24 10.304zM7.5 13.5H5.571A.571.571 0 0 1 5 12.929V8.5a.5.5 0 0 1 1 0v3.929H7.5a.5.5 0 0 1 0 1zm2.5 0a.5.5 0 0 1-1 0V8.5a.5.5 0 0 1 1 0v5zm4.857 0a.5.5 0 0 1-.45-.284L12.5 10.7v2.8a.5.5 0 0 1-1 0V8.5a.5.5 0 0 1 .95-.216l2 3.516V8.5a.5.5 0 0 1 1 0v5a.5.5 0 0 1-.593.49zm3.714 0H16.5A.571.571 0 0 1 16 12.929V8.5a.571.571 0 0 1 .571-.571h2.286a.5.5 0 0 1 0 1H17v1h1.857a.5.5 0 0 1 0 1H17v1h1.571a.5.5 0 0 1 0 1z',
    'LINEで送る'
  ));

  buttons.appendChild(makeShareBtn(
    'https://www.facebook.com/sharer/sharer.php?u=' + pageUrl,
    'share-fb',
    'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    'Facebookでシェア'
  ));

  const mediaKit = document.createElement('a');
  mediaKit.href = 'https://moraeru-okane.jp/media-kit.html';
  mediaKit.className = 'share-mediakit';
  mediaKit.textContent = '🔗 バナー素材・埋め込みコードを取得する（Webサイト掲載OK・リンク自由）';

  container.appendChild(titleEl);
  container.appendChild(subEl);
  container.appendChild(buttons);
  container.appendChild(mediaKit);
  section.appendChild(container);

  const footer = document.querySelector('footer');
  if (footer) {
    footer.parentNode.insertBefore(section, footer);
  }
})();
