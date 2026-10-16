(() => {
  const WHATSAPP_NUMBER = '593963278186'; // +593 96 327 8186
  const DEFAULT_MESSAGE = 'Hola Josué, vi tu portafolio y quiero cotizar un proyecto.';

  // Exposed so site-data.js can re-wire these links once the real
  // (dashboard-editable) number/message load from Supabase.
  window.setWaLinks = (number, message) => {
    const digits = (number || '').replace(/[^0-9]/g, '') || WHATSAPP_NUMBER;
    const text = message || DEFAULT_MESSAGE;
    const waHref = 'https://wa.me/' + digits + '?text=' + encodeURIComponent(text);
    document.querySelectorAll('.js-wa').forEach((el) => {
      el.href = waHref;
      el.target = '_blank';
      el.rel = 'noopener';
    });
    const tel = document.getElementById('contacto-tel');
    if (tel) {
      const local = digits.startsWith('593') ? digits.slice(3) : digits;
      tel.textContent = '+593 ' + local.replace(/(\d{2})(\d{3})(\d+)/, '$1 $2 $3');
    }
  };

  window.setWaLinks(WHATSAPP_NUMBER, DEFAULT_MESSAGE);
})();

// Live-site preview thumbnails: the embedded iframe has a fixed
// intrinsic size (1280x900) and is scaled down with a CSS transform
// to fit whatever width its card actually renders at. Computing the
// scale in JS (instead of a fixed CSS value) keeps it from ever
// overflowing its container at any screen size.
(() => {
  const IFRAME_WIDTH = 1280;

  function sizeLiveEmbeds() {
    document.querySelectorAll('.live-embed-viewport').forEach((viewport) => {
      const iframe = viewport.querySelector('iframe');
      if (!iframe) return;
      const scale = viewport.clientWidth / IFRAME_WIDTH;
      iframe.style.transform = 'scale(' + scale + ')';
    });
  }

  window.addEventListener('resize', sizeLiveEmbeds);
  window.addEventListener('load', sizeLiveEmbeds);
  sizeLiveEmbeds();
})();
