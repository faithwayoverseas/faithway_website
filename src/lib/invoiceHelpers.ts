// ── Invoice Helper Utilities ──────────────────────────────────────────────────

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
  'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function belowHundred(n: number): string {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
}

function belowThousand(n: number): string {
  if (n < 100) return belowHundred(n);
  const rem = n % 100;
  return ONES[Math.floor(n / 100)] + ' Hundred' + (rem ? ' ' + belowHundred(rem) : '');
}

function numToWords(n: number): string {
  if (n === 0) return 'Zero';
  if (n < 0)   return 'Minus ' + numToWords(-n);

  const groups: { value: number; label: string }[] = [
    { value: 1_000_000_000, label: 'Billion' },
    { value: 1_000_000,     label: 'Million' },
    { value: 1_000,         label: 'Thousand' },
    { value: 1,             label: '' },
  ];

  const parts: string[] = [];
  let rem = n;
  for (const { value, label } of groups) {
    if (rem >= value) {
      const chunk = Math.floor(rem / value);
      parts.push(belowThousand(chunk) + (label ? ' ' + label : ''));
      rem %= value;
    }
  }
  return parts.join(' ');
}

/** Convert a numeric amount to currency words. */
export function amountInWords(amount: number, currency: string): string {
  const intPart = Math.floor(amount);
  const decPart = Math.round((amount - intPart) * 100);
  let result = `${currency} ${numToWords(intPart)}`;
  if (decPart > 0) result += ` and ${numToWords(decPart)} Cents`;
  return result + ' Only';
}

/** Currency symbol lookup. */
export function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case 'INR': return '₹';
    case 'USD': return '$';
    case 'AED': return 'AED ';
    default:    return currency + ' ';
  }
}

/** Format a number with commas. */
export function formatAmount(amount: number, currency: string): string {
  const sym = getCurrencySymbol(currency);
  return sym + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
