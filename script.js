(() => {
  const incomeInput = document.getElementById('income');
  const sourceSelect = document.getElementById('incomeSource');
  const sourceHint = document.getElementById('sourceHint');
  const rateInputs = document.querySelectorAll('input[name="rate"]');
  const customRateInput = document.getElementById('customRate');
  const resultAmount = document.getElementById('resultAmount');
  const resultBreakdown = document.getElementById('resultBreakdown');
  const copyToast = document.getElementById('copyToast');

  const SOURCE_HINTS = {
    salary: 'הכנסה קבועה ממשכורת מחייבת בדרך כלל בהפרשת מעשר מהסכום נטו.',
    bonus: 'בונוסים ומענקים חד־פעמיים נחשבים הכנסה לכל דבר לעניין מעשר.',
    business: 'ברווח מעסק מקובל לחשב מעשר לאחר ניכוי הוצאות העסק.',
    investment: 'רווחי הון והשקעות חייבים במעשר בעת המימוש בפועל.',
    gift: 'מתנות בשווי כספי נחשבות הכנסה לעניין הפרשת מעשר.',
    inheritance: 'ישנן דעות שונות לגבי חיוב ירושה במעשר — מומלץ להתייעץ עם רב.',
    other: 'לא בטוחים איך לסווג את ההכנסה? מומלץ להתייעץ עם רב לגבי הדין המדויק.'
  };

  let currentTithe = 0;

  function formatCurrency(value) {
    return '₪' + value.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function getSelectedRate() {
    const checked = document.querySelector('input[name="rate"]:checked');
    if (!checked) return 0;
    if (checked.value === 'custom') {
      const val = parseFloat(customRateInput.value);
      return isNaN(val) ? 0 : val;
    }
    return parseFloat(checked.value);
  }

  function calculate() {
    const income = parseFloat(incomeInput.value);
    const rate = getSelectedRate();
    const validIncome = isNaN(income) || income < 0 ? 0 : income;
    currentTithe = validIncome * (rate / 100);

    resultAmount.textContent = formatCurrency(currentTithe);
    resultBreakdown.textContent = validIncome > 0
      ? `${formatCurrency(validIncome)} × ${rate || 0}%`
      : 'הזינו סכום הכנסה כדי לחשב';
  }

  incomeInput.addEventListener('input', calculate);

  sourceSelect.addEventListener('change', () => {
    sourceHint.textContent = SOURCE_HINTS[sourceSelect.value] || '';
  });
  sourceHint.textContent = SOURCE_HINTS[sourceSelect.value] || '';

  rateInputs.forEach((input) => {
    input.addEventListener('change', () => {
      customRateInput.disabled = document.querySelector('input[name="rate"]:checked').value !== 'custom';
      calculate();
    });
  });

  customRateInput.addEventListener('input', () => {
    if (document.querySelector('input[name="rate"]:checked').value === 'custom') {
      calculate();
    }
  });

  calculate();

  // --- Payment tabs ---
  const tabs = document.querySelectorAll('.pay-tab');
  const panels = document.querySelectorAll('.pay-panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
  });

  // --- Copy helpers ---
  function showToast(message) {
    copyToast.textContent = message;
    copyToast.classList.add('visible');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => copyToast.classList.remove('visible'), 2500);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      return false;
    }
  }

  document.querySelectorAll('[data-copy="amount"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const amountStr = currentTithe.toFixed(2);
      const ok = await copyText(amountStr);
      showToast(ok ? `הסכום ${formatCurrency(currentTithe)} הועתק ללוח` : 'לא ניתן להעתיק אוטומטית — העתיקו ידנית: ' + amountStr);
    });
  });

  // --- Bit ---
  document.getElementById('btnOpenBit').addEventListener('click', async () => {
    await copyText(currentTithe.toFixed(2));
    showToast('הסכום הועתק — פותח את Bit...');
    window.location.href = 'bit://';
  });

  // --- Credit link ---
  document.getElementById('btnOpenCredit').addEventListener('click', async () => {
    const link = document.getElementById('creditLink').value.trim();
    await copyText(currentTithe.toFixed(2));
    if (link) {
      showToast('הסכום הועתק — פותח את קישור התשלום...');
      window.open(link, '_blank', 'noopener');
    } else {
      showToast('הסכום הועתק ללוח. הדביקו אותו במערכת הסליקה שלכם.');
    }
  });

  // --- Bank transfer ---
  document.getElementById('btnCopyBank').addEventListener('click', async () => {
    const bank = document.getElementById('bankName').value.trim();
    const branch = document.getElementById('bankBranch').value.trim();
    const account = document.getElementById('bankAccount').value.trim();

    const lines = [`סכום: ${formatCurrency(currentTithe)}`];
    if (bank) lines.push(`בנק: ${bank}`);
    if (branch) lines.push(`סניף: ${branch}`);
    if (account) lines.push(`מספר חשבון: ${account}`);

    const ok = await copyText(lines.join('\n'));
    showToast(ok ? 'פרטי ההעברה הועתקו ללוח' : 'לא ניתן להעתיק אוטומטית — העתיקו ידנית את הפרטים');
  });

  // --- WhatsApp share ---
  document.getElementById('btnShareWhatsapp').addEventListener('click', () => {
    const text = `רציתי לתאם הפרשת מעשר בסך ${formatCurrency(currentTithe)}.`;
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
  });
})();
