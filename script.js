(() => {
  const incomeInput = document.getElementById('income');
  const incomeLabel = document.getElementById('incomeLabel');
  const incomeModeInputs = document.querySelectorAll('input[name="incomeMode"]');
  const employmentField = document.getElementById('employmentField');
  const employmentInputs = document.querySelectorAll('input[name="employment"]');
  const creditPointsField = document.getElementById('creditPointsField');
  const creditWoman = document.getElementById('creditWoman');
  const creditSingleParent = document.getElementById('creditSingleParent');
  const creditExtra = document.getElementById('creditExtra');
  const creditTotal = document.getElementById('creditTotal');
  const taxBreakdown = document.getElementById('taxBreakdown');
  const breakdownTax = document.getElementById('breakdownTax');
  const breakdownNi = document.getElementById('breakdownNi');
  const breakdownNet = document.getElementById('breakdownNet');
  const sourceSelect = document.getElementById('incomeSource');
  const sourceHint = document.getElementById('sourceHint');
  const rateInputs = document.querySelectorAll('input[name="rate"]');
  const customRateInput = document.getElementById('customRate');
  const resultAmount = document.getElementById('resultAmount');
  const resultBreakdown = document.getElementById('resultBreakdown');
  const copyToast = document.getElementById('copyToast');

  // מדרגות מס הכנסה חודשיות לשכיר, 2026
  const TAX_BRACKETS_MONTHLY = [
    { upTo: 7010, rate: 0.10 },
    { upTo: 10060, rate: 0.14 },
    { upTo: 19000, rate: 0.20 },
    { upTo: 25100, rate: 0.31 },
    { upTo: 46690, rate: 0.35 },
    { upTo: 60130, rate: 0.47 },
    { upTo: Infinity, rate: 0.50 }
  ];
  const CREDIT_POINT_VALUE = 242; // ₪ לחודש, 2026

  // ביטוח לאומי + מס בריאות משולבים, שכיר מול עצמאי, 2026
  const NI_RATES = {
    employee: { tier1Cap: 7522, tier1Rate: 0.0427, tier2Cap: 51910, tier2Rate: 0.1217 },
    selfEmployed: { tier1Cap: 7703, tier1Rate: 0.077, tier2Cap: 51910, tier2Rate: 0.18 }
  };

  function calcIncomeTax(gross) {
    let tax = 0;
    let lastCap = 0;
    for (const bracket of TAX_BRACKETS_MONTHLY) {
      if (gross <= lastCap) break;
      tax += (Math.min(gross, bracket.upTo) - lastCap) * bracket.rate;
      lastCap = bracket.upTo;
    }
    return tax;
  }

  function calcNationalInsurance(gross, employment) {
    const rates = NI_RATES[employment] || NI_RATES.employee;
    const tier1 = Math.min(gross, rates.tier1Cap) * rates.tier1Rate;
    const tier2 = gross > rates.tier1Cap ? (Math.min(gross, rates.tier2Cap) - rates.tier1Cap) * rates.tier2Rate : 0;
    return tier1 + tier2;
  }

  function getIncomeMode() {
    const checked = document.querySelector('input[name="incomeMode"]:checked');
    return checked ? checked.value : 'gross';
  }

  function getEmploymentStatus() {
    const checked = document.querySelector('input[name="employment"]:checked');
    return checked ? checked.value : 'employee';
  }

  function getCreditPoints() {
    let total = 2.25;
    if (creditWoman.checked) total += 0.5;
    if (creditSingleParent.checked) total += 1;
    const extra = parseFloat(creditExtra.value);
    total += isNaN(extra) || extra < 0 ? 0 : extra;
    return total;
  }

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
    const mode = getIncomeMode();

    let base = validIncome;

    if (mode === 'gross') {
      const points = getCreditPoints();
      creditTotal.textContent = points.toFixed(2);

      const employment = getEmploymentStatus();
      const taxBeforeCredit = calcIncomeTax(validIncome);
      const tax = Math.max(0, taxBeforeCredit - points * CREDIT_POINT_VALUE);
      const ni = calcNationalInsurance(validIncome, employment);
      const net = Math.max(0, validIncome - tax - ni);

      breakdownTax.textContent = '-' + formatCurrency(tax);
      breakdownNi.textContent = '-' + formatCurrency(ni);
      breakdownNet.textContent = formatCurrency(net);

      base = net;
    }

    currentTithe = base * (rate / 100);

    resultAmount.textContent = formatCurrency(currentTithe);
    resultBreakdown.textContent = validIncome > 0
      ? `${formatCurrency(base)} × ${rate || 0}%${mode === 'gross' ? ' (נטו)' : ''}`
      : 'הזינו סכום הכנסה כדי לחשב';
  }

  function updateIncomeModeUI() {
    const mode = getIncomeMode();
    if (mode === 'gross') {
      incomeLabel.textContent = 'משכורת/הכנסה ברוטו לחודש (₪)';
      employmentField.classList.remove('hidden');
      creditPointsField.classList.remove('hidden');
      taxBreakdown.classList.remove('hidden');
    } else {
      incomeLabel.textContent = 'סכום נטו (₪)';
      employmentField.classList.add('hidden');
      creditPointsField.classList.add('hidden');
      taxBreakdown.classList.add('hidden');
    }
  }

  incomeModeInputs.forEach((input) => {
    input.addEventListener('change', () => {
      updateIncomeModeUI();
      calculate();
    });
  });
  updateIncomeModeUI();

  employmentInputs.forEach((input) => {
    input.addEventListener('change', calculate);
  });

  incomeInput.addEventListener('input', calculate);
  creditWoman.addEventListener('change', calculate);
  creditSingleParent.addEventListener('change', calculate);
  creditExtra.addEventListener('input', calculate);

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
