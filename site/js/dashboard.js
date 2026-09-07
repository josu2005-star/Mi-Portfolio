(() => {
  const sb = window.portfolioSupabase;

  const authView = document.getElementById('auth-view');
  const editorView = document.getElementById('editor-view');
  const dashSession = document.getElementById('dash-session');
  const dashEmail = document.getElementById('dash-email');
  const authMessage = document.getElementById('auth-message');

  if (!sb) {
    authMessage.textContent = 'No se pudo cargar Supabase (revisa tu conexión y recarga la página). El panel no puede funcionar sin esto.';
    authMessage.className = 'auth-message is-error';
    document.getElementById('auth-form').querySelectorAll('input, button').forEach((el) => { el.disabled = true; });
    document.getElementById('btn-signup').disabled = true;
    return;
  }

  function showAuthMessage(text, kind) {
    authMessage.textContent = text;
    authMessage.className = 'auth-message' + (kind ? ' is-' + kind : '');
  }

  function setLoggedIn(session) {
    if (session) {
      authView.hidden = true;
      editorView.hidden = false;
      dashSession.hidden = false;
      dashEmail.textContent = session.user.email;
      loadEverything();
    } else {
      authView.hidden = false;
      editorView.hidden = true;
      dashSession.hidden = true;
    }
  }

  sb.auth.getSession().then(({ data }) => setLoggedIn(data.session));
  sb.auth.onAuthStateChange((_event, session) => setLoggedIn(session));

  document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    showAuthMessage('Entrando…');
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) showAuthMessage(error.message, 'error');
    else showAuthMessage('');
  });

  document.getElementById('btn-signup').addEventListener('click', async () => {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    if (!email || password.length < 6) {
      showAuthMessage('Escribe tu correo y una contraseña de al menos 6 caracteres.', 'error');
      return;
    }
    showAuthMessage('Creando cuenta…');
    const { error } = await sb.auth.signUp({ email, password });
    if (error) showAuthMessage(error.message, 'error');
    else showAuthMessage('Cuenta creada. Ahora ve a tu proyecto de Supabase → Authentication → Settings y desactiva "Allow new users to sign up" para que nadie más pueda registrarse.', 'ok');
  });

  document.getElementById('btn-logout').addEventListener('click', () => sb.auth.signOut());

  function loadEverything() {
    loadBusinessInfo();
    loadServices();
    loadCases();
    loadSteps();
    loadStats();
  }

  // ---------- Portada y contacto ----------

  async function loadBusinessInfo() {
    const { data, error } = await sb.from('business_info').select('*').eq('id', 1).maybeSingle();
    if (error || !data) return;
    document.getElementById('f-hero_eyebrow').value = data.hero_eyebrow || '';
    document.getElementById('f-hero_headline').value = data.hero_headline || '';
    document.getElementById('f-hero_subhead').value = data.hero_subhead || '';
    document.getElementById('f-whatsapp_number').value = data.whatsapp_number || '';
    document.getElementById('f-whatsapp_message').value = data.whatsapp_message || '';
    document.getElementById('f-contact_headline').value = data.contact_headline || '';
    document.getElementById('f-contact_lede').value = data.contact_lede || '';
  }

  document.getElementById('business-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.querySelector('[data-status-for="business-form"]');
    status.textContent = 'Guardando…';
    const { error } = await sb.from('business_info').upsert({
      id: 1,
      hero_eyebrow: document.getElementById('f-hero_eyebrow').value,
      hero_headline: document.getElementById('f-hero_headline').value,
      hero_subhead: document.getElementById('f-hero_subhead').value,
      whatsapp_number: document.getElementById('f-whatsapp_number').value.replace(/[^0-9]/g, ''),
      whatsapp_message: document.getElementById('f-whatsapp_message').value,
      contact_headline: document.getElementById('f-contact_headline').value,
      contact_lede: document.getElementById('f-contact_lede').value,
      updated_at: new Date().toISOString(),
    });
    status.textContent = error ? 'Error: ' + error.message : 'Guardado ✓';
  });

  // ---------- Generic record-list helper (services / cases / steps) ----------

  function field(container, key, label, type, extra) {
    const wrap = document.createElement('label');
    if (type === 'checkbox') {
      wrap.className = 'checkbox-row';
      wrap.innerHTML = `<input type="checkbox" data-key="${key}"> ${label}`;
    } else if (type === 'textarea') {
      wrap.innerHTML = `${label}<textarea data-key="${key}" rows="${extra?.rows || 2}" maxlength="${extra?.maxlength || 600}"></textarea>`;
    } else {
      wrap.innerHTML = `${label}<input type="text" data-key="${key}" maxlength="${extra?.maxlength || 200}">`;
    }
    container.appendChild(wrap);
    return wrap.querySelector('[data-key]');
  }

  function buildRecordCard(table, record, fieldDefs, { onSaved, onDeleted } = {}) {
    const card = document.createElement('div');
    card.className = 'record-card';

    const inputs = {};
    let currentGrid = null;
    fieldDefs.forEach((def) => {
      let target = card;
      if (def.grid) {
        if (!currentGrid || currentGrid.dataset.group !== def.grid) {
          currentGrid = document.createElement('div');
          currentGrid.className = 'grid-2';
          currentGrid.dataset.group = def.grid;
          card.appendChild(currentGrid);
        }
        target = currentGrid;
      } else {
        currentGrid = null;
      }
      inputs[def.key] = field(target, def.key, def.label, def.type, def);
      if (def.type === 'checkbox') inputs[def.key].checked = !!record[def.key];
      else inputs[def.key].value = record[def.key] ?? '';
    });

    const foot = document.createElement('div');
    foot.className = 'record-card-foot';
    foot.innerHTML = `
      <button type="button" class="btn btn-primary btn-save">Guardar</button>
      <button type="button" class="btn btn-danger btn-delete">Eliminar</button>
      <span class="save-status"></span>
    `;
    card.appendChild(foot);

    const status = foot.querySelector('.save-status');

    foot.querySelector('.btn-save').addEventListener('click', async () => {
      const patch = {};
      fieldDefs.forEach((def) => {
        const el = inputs[def.key];
        patch[def.key] = def.type === 'checkbox' ? el.checked
          : def.type === 'number' ? Number(el.value || 0)
          : el.value;
      });
      patch.updated_at = new Date().toISOString();
      status.textContent = 'Guardando…';
      const { error } = await sb.from(table).update(patch).eq('id', record.id);
      status.textContent = error ? 'Error: ' + error.message : 'Guardado ✓';
      if (!error) onSaved && onSaved();
    });

    foot.querySelector('.btn-delete').addEventListener('click', async () => {
      if (!confirm('¿Eliminar esto del sitio? No se puede deshacer.')) return;
      const { error } = await sb.from(table).delete().eq('id', record.id);
      if (error) { status.textContent = 'Error: ' + error.message; return; }
      card.remove();
      onDeleted && onDeleted();
    });

    return card;
  }

  const SERVICE_FIELDS = [
    { key: 'title', label: 'Título', grid: 'a' },
    { key: 'price_label', label: 'Precio (ej. "desde $280")', grid: 'a' },
    { key: 'description', label: 'Descripción', type: 'textarea', rows: 3 },
    { key: 'kicker', label: 'Etiqueta mono (ej. "DOMINIO · MÓVIL · WHATSAPP")' },
    { key: 'is_highlighted', label: 'Destacar en oscuro (como "Manual de identidad")', type: 'checkbox' },
    { key: 'sort_order', label: 'Orden', type: 'number' },
  ];

  const CASE_FIELDS = [
    { key: 'title', label: 'Título del caso' },
    { key: 'tag_1', label: 'Etiqueta 1', grid: 'a' },
    { key: 'tag_2', label: 'Etiqueta 2 (opcional)', grid: 'a' },
    { key: 'paragraph_1', label: 'Párrafo 1', type: 'textarea', rows: 3 },
    { key: 'paragraph_2', label: 'Párrafo 2 (opcional)', type: 'textarea', rows: 2 },
    { key: 'link_label', label: 'Texto del enlace', grid: 'b' },
    { key: 'link_url', label: 'URL del enlace', grid: 'b' },
    { key: 'meta_note', label: 'Nota pequeña (opcional, ej. "12 PÁGINAS · v1.0")' },
    { key: 'sort_order', label: 'Orden', type: 'number' },
  ];

  const STEP_FIELDS = [
    { key: 'step_number', label: 'Número (ej. "01")', grid: 'a' },
    { key: 'title', label: 'Título', grid: 'a' },
    { key: 'description', label: 'Descripción', type: 'textarea', rows: 3 },
    { key: 'sort_order', label: 'Orden', type: 'number' },
  ];

  async function loadServices() {
    const list = document.getElementById('services-list');
    list.innerHTML = '';
    const { data, error } = await sb.from('services').select('*').order('sort_order');
    if (error || !data) return;
    data.forEach((rec) => list.appendChild(buildRecordCard('services', rec, SERVICE_FIELDS, { onDeleted: loadServices })));
  }

  async function loadCases() {
    const list = document.getElementById('cases-list');
    list.innerHTML = '';
    const { data, error } = await sb.from('cases').select('*').order('sort_order');
    if (error || !data) return;
    data.forEach((rec) => list.appendChild(buildRecordCard('cases', rec, CASE_FIELDS, { onDeleted: loadCases })));
  }

  async function loadSteps() {
    const list = document.getElementById('steps-list');
    list.innerHTML = '';
    const { data, error } = await sb.from('process_steps').select('*').order('sort_order');
    if (error || !data) return;
    data.forEach((rec) => list.appendChild(buildRecordCard('process_steps', rec, STEP_FIELDS, { onDeleted: loadSteps })));
  }

  document.getElementById('btn-add-service').addEventListener('click', async () => {
    const { error } = await sb.from('services').insert({
      title: 'Nuevo servicio', price_label: 'desde $0', description: '', kicker: '', sort_order: 99,
    });
    if (!error) loadServices();
  });

  document.getElementById('btn-add-case').addEventListener('click', async () => {
    const { error } = await sb.from('cases').insert({
      title: 'Nuevo caso', tag_1: '', tag_2: '', paragraph_1: '', paragraph_2: '',
      link_label: '', link_url: '', meta_note: '', sort_order: 99,
    });
    if (!error) loadCases();
  });

  document.getElementById('btn-add-step').addEventListener('click', async () => {
    const { error } = await sb.from('process_steps').insert({
      step_number: '0X', title: 'Nuevo paso', description: '', sort_order: 99,
    });
    if (!error) loadSteps();
  });

  async function loadStats() {
    const { count, error } = await sb
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'whatsapp_click');
    document.getElementById('stat-wa-clicks').textContent = error ? '—' : String(count ?? 0);
  }
})();
