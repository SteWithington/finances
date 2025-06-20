// === Imports ===
import { getCurrentDate } from './objects/dateUtils.js';
import { getStoredExchangeRate, calculateAUD, calculateGBP } from './objects/exchange.js';
import { getStoredSalaryPreTax } from './objects/salary.js';

document.addEventListener('DOMContentLoaded', () => {

  // === DOM Elements ===
  const exchangeInput = document.getElementById('gbpToAudExchangeRate');
  const salaryPreTax = document.getElementById('salaryPreTax');
  const salaryPostTax = document.getElementById('salaryPostTax');
  const gbpInputUkBankAccount = document.getElementById('gbpInputUkBankAccountGbp');
  const audOutputUkBankAccount = document.getElementById('audOutputUkBankAccount');
  const gbpAssetsTotalEl = document.getElementById('gbpAssetsTotal');
  const audAssetsTotalEl = document.getElementById('audAssetsTotal');
  const tableBody = document.getElementById('gainsTableBody');
  const addGainsRowBtn = document.getElementById('addGainsRowBtn');
  const salaryTypeRadios = document.querySelectorAll('input[name="salaryType"]');
  const packageDeductionInput = document.getElementById('packageDeduction');
  const packageDeductionRow = document.getElementById('packageDeductionRow');
  const monthlyWagePostTaxEl = document.getElementById('monthlyWagePostTax');

  // === Config ===
  const assetFields = [
    { gbpInputId: 'gbpInputUkBankAccountGbp', audOutputId: 'audOutputUkBankAccount' },
    { gbpInputId: 'gbpInputUkSavingsAccountGbp', audOutputId: 'audOutputUkSavingsAccount' },
    { gbpInputId: 'gbpInputUkIsaAccountGbp', audOutputId: 'audOutputUkIsaAccount' },
    { audInputId: 'audInputAusBankAccountAud', gbpOutputId: 'gbpOutputAusBankAccount' },
    { audInputId: 'audInputAusSavingsAccountAud', gbpOutputId: 'gbpOutputAusSavingsAccount' },
  ];

  function formatCurrency(value) {
  return Number(value).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // === Unrealised Gains Table ===
  const savedGains = JSON.parse(localStorage.getItem('unrealisedGains') || '[]');
  tableBody.innerHTML = '';

  if (savedGains.length) {
    savedGains.forEach((item, index) => {
      const row = createRow(item.assetName, item.remainingPayments, item.currentValuation, true);
      tableBody.appendChild(row);
    });
  }

  function createRow(assetName = '', remainingPayments = '', currentValuation = '', showDelete = true) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" value="${assetName}"></td>
      <td><input type="number" step="0.01" value="${remainingPayments}"></td>
      <td><input type="number" step="0.01" value="${currentValuation}"></td>
      <td class="equityCell">0.00</td>
      ${showDelete ? `<td><button class="deleteRowBtn"><i class="fas fa-trash-alt"></i></button></td>` : '<td></td>'}
    `;

    attachInputListeners(row);
    calculateEquityRow(row);

    if (showDelete) {
      row.querySelector('.deleteRowBtn').addEventListener('click', () => row.remove());
    }

    return row;
  }

  function attachInputListeners(row) {
    const inputs = row.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
      input.addEventListener('input', () => calculateEquityRow(row));
    });
  }

  function calculateEquityRow(row) {
    const numberInputs = row.querySelectorAll('input[type="number"]');
    const remainingPayments = parseFloat(numberInputs[0]?.value) || 0;
    const currentValuation = parseFloat(numberInputs[1]?.value) || 0;
    const equityCell = row.querySelector('.equityCell');
    equityCell.textContent = (currentValuation - remainingPayments).toFixed(2);
  }

  // === Liabilities Table ===
  const liabilitiesTableBody = document.getElementById('liabilitiesTableBody');
  const addLiabilityRowBtn = document.getElementById('addLiabilityRowBtn');

  // Load liabilities from localStorage
  const savedLiabilities = JSON.parse(localStorage.getItem('liabilitiesData') || '[]');
  liabilitiesTableBody.innerHTML = '';

  if (savedLiabilities.length) {
    savedLiabilities.forEach((item, index) => {
      const row = createLiabilityRow(item.liabilityName, item.monthlyRepayment, item.totalOwed, true);
      liabilitiesTableBody.appendChild(row);
    });
  }

  function createLiabilityRow(liabilityName = '', monthlyRepayment = '', totalOwed = '', showDelete = true) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" value="${liabilityName}"></td>
      <td><input type="number" step="0.01" value="${monthlyRepayment}"></td>
      <td><input type="number" step="0.01" value="${totalOwed}"></td>
      <td class="netLiabilityCell">0.00</td>
      ${showDelete ? `<td><button class="deleteLiabilityBtn"><i class="fas fa-trash-alt"></i></button></td>` : '<td></td>'}
    `;

    attachLiabilityInputListeners(row);
    calculateNetLiability(row);

    if (showDelete) {
      row.querySelector('.deleteLiabilityBtn').addEventListener('click', () => {
        row.remove();
        saveLiabilitiesToStorage();
      });
    }

    return row;
  }

  function attachLiabilityInputListeners(row) {
    const inputs = row.querySelectorAll('input[type="number"], input[type="text"]');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        calculateNetLiability(row);
        saveLiabilitiesToStorage();
      });
    });
  }

  function calculateNetLiability(row) {
    const numberInputs = row.querySelectorAll('input[type="number"]');
    const monthlyRepayment = parseFloat(numberInputs[0]?.value) || 0;
    const totalOwed = parseFloat(numberInputs[1]?.value) || 0;
    const netLiabilityCell = row.querySelector('.netLiabilityCell');
    netLiabilityCell.textContent = (totalOwed - monthlyRepayment).toFixed(2);
  }

  function saveLiabilitiesToStorage() {
    const rows = liabilitiesTableBody.querySelectorAll('tr');
    const data = [];

    rows.forEach(row => {
      const inputs = row.querySelectorAll('input');
      if (inputs.length >= 3) {
        data.push({
          liabilityName: inputs[0].value,
          monthlyRepayment: parseFloat(inputs[1].value) || 0,
          totalOwed: parseFloat(inputs[2].value) || 0
        });
      }
    });

    localStorage.setItem('liabilitiesData', JSON.stringify(data));
  }

  // Add new liability row button
  addLiabilityRowBtn.addEventListener('click', () => {
    const newRow = createLiabilityRow('', '', '', true);
    liabilitiesTableBody.appendChild(newRow);
  });

  function updateTotals() {
  // 1. Bank Accounts Total AUD (sum all AUD inputs in bank table)
  const audBankInputs = [
    'audInputAusBankAccountAud',
    'audInputAusSavingsAccountAud',
    'audOutputUkBankAccount',       // these are outputs, so you might want to include them too if they hold AUD values
    'audOutputUkSavingsAccount',
    'audOutputUkIsaAccount'
  ];

  let totalBankAud = 0;
  audBankInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const val = parseFloat(el.value || el.textContent) || 0;
      totalBankAud += val;
    }
  });

  function setAmountClass(elementId, amount) {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  if (amount < 0) {
    el.classList.add('negative-amount');
    el.classList.remove('positive-amount');
  } else {
    el.classList.add('positive-amount');
    el.classList.remove('negative-amount');
  }
  }

  // 2. Unrealised Gains Total (sum currentValuation in gainsTable)
  const gainsRows = document.querySelectorAll('#gainsTableBody tr');
  let totalGains = 0;
  gainsRows.forEach(row => {
    const equityCell = row.cells[3]; // 0-based index, 4th cell = equity
    if (equityCell) {
      totalGains += parseFloat(equityCell.textContent) || 0;
    }
  });

  // 3. Liabilities Total Balance (sum Balance column)
  const liabilityRows = document.querySelectorAll('#liabilitiesTableBody tr');
  let totalLiabilities = 0;
  liabilityRows.forEach(row => {
    const balanceCell = row.cells[3];  // 4th cell = Balance
    if (balanceCell) {
      const val = parseFloat(balanceCell.textContent) || 0;
      totalLiabilities += val;
    }
  });

  // 4. Overall Current Position = Bank Accounts Total + Unrealised Gains - Liabilities Total
  const overallPosition = totalBankAud + totalGains - totalLiabilities;

  // Update DOM
  document.getElementById('totalBankAccountsAud').textContent = formatCurrency(totalBankAud);
  document.getElementById('totalUnrealisedGains').textContent = formatCurrency(totalGains);
  document.getElementById('totalLiabilitiesBalance').textContent = formatCurrency(totalLiabilities);
  document.getElementById('overallCurrentPosition').textContent = formatCurrency(overallPosition);

  // Set classes based on value
  setAmountClass('totalBankAccountsAud', totalBankAud);
  setAmountClass('overallCurrentPosition', overallPosition);
  }

  // Call updateTotals on form submit and also after adding/removing rows or inputs changed
  document.getElementById('financesForm').addEventListener('submit', function(event) {
    event.preventDefault();

    updateTotals();
  });

  // Also update totals on input changes for live feedback (optional)
  document.querySelectorAll('#financesForm input').forEach(input => {
    input.addEventListener('input', updateTotals);
  });

  // Run once on page load to show initial totals
  window.addEventListener('load', updateTotals);

  // === Exchange Rate Fetch ===
  async function fetchExchangeRate() {
    try {
      const response = await fetch('https://api.frankfurter.app/latest?from=GBP&to=AUD');
      const data = await response.json();

      console.log("Exchange rate API response:", data);

      if (data && data.rates && data.rates.AUD) {
        const rate = data.rates.AUD;
        exchangeInput.textContent = rate.toFixed(4);
        localStorage.setItem('gbpToAudExchangeRate', rate);
        updateAll();
      } else {
        console.warn("Could not retrieve exchange rate.");
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
    }
  }

  // === Calculate Post Tax Salary ===
  function calculatePostTaxSalary(preTaxSalary) {
    let tax = 0;
    const medicareLevyRate = 0.02;
    
    if (preTaxSalary <= 18200) {
      tax = 0;
    } else if (preTaxSalary <= 45000) {
      tax = (preTaxSalary - 18200) * 0.19;
    } else if (preTaxSalary <= 120000) {
      tax = 5092 + (preTaxSalary - 45000) * 0.325;
    } else if (preTaxSalary <= 180000) {
      tax = 29467 + (preTaxSalary - 120000) * 0.37;
    } else {
      tax = 51667 + (preTaxSalary - 180000) * 0.45;
    }

    // Medicare levy
    const medicareLevy = preTaxSalary * medicareLevyRate;

    const postTaxSalary = preTaxSalary - tax - medicareLevy;
    return postTaxSalary;
  }

  // === Update AUD Logic ===
  function updateAUD() {
    const exchangeRate = parseFloat(exchangeInput.textContent) || 0;
    audOutputUkBankAccount.textContent = calculateAUD(gbpInputUkBankAccount.value, exchangeRate);
  }

  // Load stored percentage or default to 11.5%
  const packageDeductionPercentageInput = document.getElementById('packageDeductionPercent');
  const defaultPercentage = 11.5;
  const storedPercentage = localStorage.getItem('packageDeductionPercent');
  packageDeductionPercentageInput.value = storedPercentage !== null ? storedPercentage : defaultPercentage;

  // Store updated value when changed
  packageDeductionPercentageInput.addEventListener('input', () => {
      const value = parseFloat(packageDeductionPercentageInput.value);
      if (!isNaN(value)) {
          localStorage.setItem('packageDeductionPercent', value);
          updateSalaryPostTax();
      }
  });

  // === Updated Salary Post Tax with Package deduction ===
  function updateSalaryPostTax() {
    const preTax = parseFloat(salaryPreTax.value);
    if (isNaN(preTax)) {
      salaryPostTax.textContent = 'N/A';
      packageDeductionInput.value = '';
      packageDeductionRow.style.display = 'none';
      return;
    }

    // Get selected salary type
    const salaryType = Array.from(salaryTypeRadios).find(r => r.checked)?.value || 'base';

    let adjustedPreTax = preTax;

    if (salaryType === 'package') {
      const deductionPercent = parseFloat(localStorage.getItem('packageDeductionPercent')) || defaultPercentage;
      const deduction = preTax * (deductionPercent / 100);

      packageDeductionInput.textContent = formatCurrency(deduction);
      packageDeductionRow.classList.add('enabled-row');
      packageDeductionRow.classList.remove('disabled-row');

      adjustedPreTax = preTax - deduction;
    } else {
      packageDeductionInput.textContent = '';
      packageDeductionRow.classList.add('disabled-row');
      packageDeductionRow.classList.remove('enabled-row');
    }

    const postTax = calculatePostTaxSalary(adjustedPreTax);
    salaryPostTax.textContent = formatCurrency(postTax);

    const monthlyWagePostTax = (postTax / 12);
    monthlyWagePostTaxEl.textContent = formatCurrency(monthlyWagePostTax);
  }

  function updateAssetTotals() {
    const exchangeRate = parseFloat(exchangeInput.textContent) || 0;
    let gbpTotal = 0;
    let audTotal = 0;

    assetFields.forEach(field => {
      if (field.gbpInputId) {
        const gbp = parseFloat(document.getElementById(field.gbpInputId).value) || 0;
        const aud = calculateAUD(gbp, exchangeRate);
        document.getElementById(field.audOutputId).textContent = formatCurrency(aud);
        gbpTotal += gbp;
        audTotal += parseFloat(aud) || 0;
      } else if (field.audInputId) {
        const aud = parseFloat(document.getElementById(field.audInputId).value) || 0;
        const gbp = calculateGBP(aud, exchangeRate);
        document.getElementById(field.gbpOutputId).textContent = formatCurrency(gbp);
        audTotal += aud;
        gbpTotal += parseFloat(gbp) || 0;
      }
    });

    gbpAssetsTotalEl.textContent = formatCurrency(gbpTotal);
    audAssetsTotalEl.textContent = formatCurrency(audTotal);
  }

  function updateAll() {
    updateAUD();
    updateSalaryPostTax();
    updateAssetTotals();
  }

  // === Event Listeners ===
  addGainsRowBtn.addEventListener('click', () => {
    const newRow = createRow('', '', '', true);
    tableBody.appendChild(newRow);
  });

  document.getElementById('refreshExchangeRateBtn').addEventListener('click', fetchExchangeRate);
  // exchangeInput.addEventListener('input', updateAll);
  gbpInputUkBankAccount.addEventListener('input', updateAll);
  salaryPreTax.addEventListener('input', updateSalaryPostTax);
  salaryTypeRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    localStorage.setItem('salaryType', radio.value);
    updateSalaryPostTax();
    });
  });

  // === Initialisation ===
  document.getElementById('currentDate').textContent = getCurrentDate();

  exchangeInput.textContent = getStoredExchangeRate();
  fetchExchangeRate();

  const storedSalary = getStoredSalaryPreTax();
  salaryPreTax.value = storedSalary?.replace(',', '.') || '';

  const storedSalaryType = localStorage.getItem('salaryType');
  if (storedSalaryType) {
    const matchingRadio = Array.from(salaryTypeRadios).find(r => r.value === storedSalaryType);
    if (matchingRadio) matchingRadio.checked = true;
  }

  assetFields.forEach(field => {
    const inputId = field.gbpInputId || field.audInputId;
    const inputEl = document.getElementById(inputId);
    const storedValue = localStorage.getItem(inputId);
    if (storedValue) inputEl.value = storedValue;

    inputEl.addEventListener('input', () => {
      localStorage.setItem(inputId, inputEl.value);
      updateAll();
    });
  });

  updateAll();
});