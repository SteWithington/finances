// objects/exchange.js
export function getStoredExchangeRate() {
  return localStorage.getItem('gbpToAudExchangeRate') || '2.50';
}

export function saveExchangeRate(rate) {
  localStorage.setItem('gbpToAudExchangeRate', rate);
}

export function calculateAUD(gbp, rate) {
  const gbpNum = parseFloat(gbp) || 0;
  const rateNum = parseFloat(rate) || 0;
  return (gbpNum * rateNum).toFixed(2);
}

export function calculateGBP(aud, rate) {
  const audNum = parseFloat(aud) || 0;
  const rateNum = parseFloat(rate) || 0;
  return (audNum / rateNum).toFixed(2);
}