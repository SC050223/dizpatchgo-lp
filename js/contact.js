/**
 * DizpatchGO — Contact Form Handler
 * Security: client-side validation, honeypot anti-spam, sanitized inputs,
 * email obfuscation, no sensitive data embedded.
 */
(function () {
  'use strict';

  /* ── Sanitize: strip HTML tags from user input ─────────── */
  function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML.trim();
  }

  /* ── Validate email format ──────────────────────────────── */
  function isValidEmail(email) {
    // RFC 5322 simplified pattern
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  /* ── Validate phone (optional, basic) ──────────────────── */
  function isValidPhone(phone) {
    if (!phone) return true; // optional
    return /^[\d\s\+\-\(\)]{7,20}$/.test(phone);
  }

  /* ── Show / hide field error ────────────────────────────── */
  function setError(fieldId, errorId, show) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (!field || !error) return;
    if (show) {
      field.setAttribute('aria-invalid', 'true');
      error.classList.add('visible');
    } else {
      field.removeAttribute('aria-invalid');
      error.classList.remove('visible');
    }
    return show;
  }

  /* ── Obfuscated email assembly (anti-scraping) ──────────── */
  function getSalesEmail() {
    // Split to prevent scrapers from trivially extracting
    const parts = ['damien.chin', '@', 'presoft', '.', 'com.my'];
    return parts.join('');
  }

  /* ── Build mailto body from sanitized form fields ───────── */
  function buildMailtoUrl(data) {
    const body = [
      'Name: ' + data.name,
      'Company: ' + data.company,
      'Email: ' + data.email,
      'Phone: ' + (data.phone || 'N/A'),
      'Fleet Size: ' + (data.fleetSize || 'N/A'),
      'Message:\n' + data.message,
    ].join('\n');
    return (
      'mailto:' + getSalesEmail() +
      '?subject=' + encodeURIComponent('DizpatchGO Demo Request — ' + data.company) +
      '&body=' + encodeURIComponent(body)
    );
  }

  /* ── Main form submission handler ───────────────────────── */
  function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const submitBtn = document.getElementById('submitBtn');
    const successMsg = document.getElementById('formSuccess');
    const formFields = document.getElementById('formFields');

    /* ── Check if redirected from successful PHP submission ── */
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('sent') === '1') {
    showSuccess(successMsg, formFields, submitBtn);
    window.history.replaceState({}, document.title, window.location.pathname);
    return; // Exit early; don't attach submit listener
  }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      /* --- Honeypot check (anti-spam) --- */
      const pot = form.querySelector('.honeypot');
      if (pot && pot.value) {
        // Silent fail — looks successful to bots
        showSuccess(successMsg, formFields, submitBtn);
        return;
      }

      /* --- Collect & sanitize values --- */
      const name      = sanitize(document.getElementById('fname')?.value || '');
      const company   = sanitize(document.getElementById('fcompany')?.value || '');
      const email     = sanitize(document.getElementById('femail')?.value || '');
      const phone     = sanitize(document.getElementById('fphone')?.value || '');
      const fleetSize = sanitize(document.getElementById('ffleet')?.value || '');
      const message   = sanitize(document.getElementById('fmessage')?.value || '');

      /* --- Validation --- */
      let hasError = false;
      hasError = setError('fname', 'fname-error', !name) || hasError;
      hasError = setError('fcompany', 'fcompany-error', !company) || hasError;
      hasError = setError('femail', 'femail-error', !email || !isValidEmail(email)) || hasError;
      hasError = setError('fphone', 'fphone-error', !isValidPhone(phone)) || hasError;
      hasError = setError('fmessage', 'fmessage-error', !message || message.length < 10) || hasError;

      if (hasError) {
        // Focus the first invalid field
        const firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      /* --- Clear errors on clean submit --- */
      ['fname', 'fcompany', 'femail', 'fphone', 'fmessage'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.removeAttribute('aria-invalid');
      });
      form.querySelectorAll('.form-error').forEach((e) => e.classList.remove('visible'));

      const generalError = document.getElementById('formGeneralError');
      if (generalError) {
        generalError.classList.remove('visible');
        generalError.textContent = '';
      }

      /* --- Show Loading State on Button --- */
      const originalBtnHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="en">⏳ Sending Request...</span><span class="zh">⏳ 正在提交...</span>';

      const formData = new FormData(form);

      fetch(form.action || 'send-demo.php', {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      .then(async (response) => {
        let result;
        try {
          result = await response.json();
        } catch (_) {
          result = null;
        }

        if (response.ok && result && result.success) {
          showSuccess(successMsg, formFields, submitBtn, generalError);
        } else {
          const message = (result && result.message) 
            ? result.message 
            : ('Submission failed (HTTP ' + response.status + '). Please ensure your server runs PHP and mail settings are valid.');
          if (generalError) {
            generalError.textContent = message;
            generalError.classList.add('visible');
          } else {
            alert(message);
          }
        }
      })
      .catch((err) => {
        const message = 'Unable to reach the server (send-demo.php). If testing locally, please run through a PHP-enabled local server (e.g., XAMPP, WAMP, or `php -S localhost:8000`).';
        if (generalError) {
          generalError.textContent = message;
          generalError.classList.add('visible');
        } else {
          alert(message);
        }
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      });
    });

    /* --- Live validation (clear error when user types) --- */
    form.querySelectorAll('.form-control').forEach((input) => {
      input.addEventListener('input', function () {
        if (this.getAttribute('aria-invalid')) {
          this.removeAttribute('aria-invalid');
          const errorId = this.id + '-error';
          const err = document.getElementById(errorId);
          if (err) err.classList.remove('visible');
        }
      });
    });
  }

  function showSuccess(successEl, fieldsEl, btn, errEl) {
    if (successEl) successEl.classList.add('visible');
    if (fieldsEl) fieldsEl.style.display = 'none';
    if (btn) btn.style.display = 'none';
    if (errEl) errEl.style.display = 'none';
  }

  document.addEventListener('DOMContentLoaded', initContactForm);
})();
