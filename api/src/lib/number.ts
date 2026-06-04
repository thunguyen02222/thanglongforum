export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

export function convertToFiniteNumber(number: number): number {
  return Number.isFinite(number) ? number : 0;
}

export function toFixedNumber2(value: number | string): number {
  const val =
    typeof value === 'string' ? Number(value.replace(/\$|(,*)/g, '')) : value;
  if (Number.isNaN(val) || !Number.isFinite(val)) {
    return 0;
  }
  const number = Math.round(val * 100) / 100;
  return number;
}

export function toValidNumber(value: any): number {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
}
