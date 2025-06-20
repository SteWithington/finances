export function getStoredSalaryPreTax() {
  return localStorage.getItem('salaryPreTax') || '100000.00';
}

export function saveSalaryPreTax(value) {
  localStorage.setItem('salaryPreTax', value);
}

export function calculateSalaryPostTax(preTax) {
  const salary = parseFloat(preTax) || 0;
  return salary * 0.75; // 25% tax
}