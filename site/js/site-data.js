// Progressive enhancement: the HTML already renders the last-known
// content instantly (so the page is never blank/loading). If Supabase
// is reachable, this overlays whatever the dashboard has since changed.
// Any failure here (offline, RLS misconfigured, schema not exposed yet)
// just leaves the static fallback content in place.
(() => {
  const sb = window.portfolioSupabase;
  if (!sb) return;

  function setText(root, field, value) {
    if (value == null || value === '') return;
    const el = root.querySelector(`[data-field="${field}"]`);
    if (!el) return;
    if (el.classList.contains('case-link')) {
      el.textContent = value;
    } else {
      el.textContent = value;
    }
  }

  function setLink(root, field, label, url) {
    const el = root.querySelector(`[data-field="${field}"]`);
    if (!el) return;
    if (label) el.textContent = label;
    if (url) el.href = url;
  }

  async function hydrateBusinessInfo() {
    const { data, error } = await sb.from('business_info').select('*').eq('id', 1).maybeSingle();
    if (error || !data) return;
    setText(document, 'hero_eyebrow', data.hero_eyebrow);
    setText(document, 'hero_headline', data.hero_headline);
    setText(document, 'hero_subhead', data.hero_subhead);
    setText(document, 'contact_headline', data.contact_headline);
    setText(document, 'contact_lede', data.contact_lede);
    if (data.whatsapp_number) {
      window.setWaLinks && window.setWaLinks(data.whatsapp_number, data.whatsapp_message);
    }
  }

  async function hydrateServices() {
    const grid = document.getElementById('servicios-grid');
    if (!grid) return;
    const { data, error } = await sb.from('services').select('*').order('sort_order');
    if (error || !data || !data.length) return;
    grid.innerHTML = '';
    for (const svc of data) {
      const article = document.createElement('article');
      article.className = 'service-card' + (svc.is_highlighted ? ' is-dark' : '');
      article.innerHTML = `
        <div class="service-card-head">
          <h3></h3>
          <span class="service-price"></span>
        </div>
        <p class="desc"></p>
        <p class="kicker"></p>
      `;
      article.querySelector('h3').textContent = svc.title;
      article.querySelector('.service-price').textContent = svc.price_label;
      article.querySelector('.desc').textContent = svc.description;
      article.querySelector('.kicker').textContent = svc.kicker;
      grid.appendChild(article);
    }
  }

  async function hydrateCases() {
    const { data, error } = await sb.from('cases').select('*').order('sort_order');
    if (error || !data || !data.length) return;
    document.querySelectorAll('[data-case-index]').forEach((root) => {
      const idx = Number(root.getAttribute('data-case-index'));
      const c = data[idx];
      if (!c) return;
      setText(root, 'tag_1', c.tag_1);
      setText(root, 'tag_2', c.tag_2);
      setText(root, 'title', c.title);
      setText(root, 'paragraph_1', c.paragraph_1);
      setText(root, 'paragraph_2', c.paragraph_2);
      setText(root, 'meta_note', c.meta_note);
      setLink(root, 'link', c.link_label, c.link_url);
    });
  }

  async function hydrateProcessSteps() {
    const grid = document.getElementById('proceso-grid');
    if (!grid) return;
    const { data, error } = await sb.from('process_steps').select('*').order('sort_order');
    if (error || !data || !data.length) return;
    grid.innerHTML = '';
    for (const step of data) {
      const div = document.createElement('div');
      div.className = 'proceso-step';
      div.innerHTML = `<span class="num"></span><h3></h3><p></p>`;
      div.querySelector('.num').textContent = step.step_number;
      div.querySelector('h3').textContent = step.title;
      div.querySelector('p').textContent = step.description;
      grid.appendChild(div);
    }
  }

  function trackWhatsappClicks() {
    document.querySelectorAll('.js-wa').forEach((el) => {
      el.addEventListener('click', () => {
        sb.from('analytics_events').insert({ event_type: 'whatsapp_click' }).then(() => {});
      });
    });
  }

  Promise.allSettled([
    hydrateBusinessInfo(),
    hydrateServices(),
    hydrateCases(),
    hydrateProcessSteps(),
  ]).then(trackWhatsappClicks);
})();
