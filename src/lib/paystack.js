// Paystack bank codes (name → Paystack bank_code)
export const BANK_LIST = [
  { name: 'Access Bank', code: '044' },
  { name: 'Citibank Nigeria', code: '023' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank', code: '011' },
  { name: 'First City Monument Bank (FCMB)', code: '214' },
  { name: 'GTBank', code: '058' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Kuda Bank', code: '90267' },
  { name: 'Moniepoint MFB', code: '50515' },
  { name: 'Opay', code: '999992' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'UBA', code: '033' },
  { name: 'Union Bank', code: '032' },
  { name: 'Unity Bank', code: '215' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
];

export function getBankCode(bankName) {
  return BANK_LIST.find((b) => b.name === bankName)?.code || null;
}

export function getAllBanks() {
  return BANK_LIST;
}

export function maskAccountNumber(accountNumber) {
  if (!accountNumber) return '—';
  const str = String(accountNumber);
  if (str.length <= 4) return str;
  return `****${str.slice(-4)}`;
}

export async function verifyAccount(accountNumber, bankCode) {
  const res = await fetch(
    `/api/paystack-verify-account?account_number=${accountNumber}&bank_code=${bankCode}`
  );
  const data = await res.json();
  if (!res.ok || !data.status) throw new Error(data.message || 'Account verification failed');
  return data.data;
}

export async function createRecipient({ name, accountNumber, bankCode }) {
  const res = await fetch('/api/paystack-create-recipient', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'nuban',
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN',
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.status) throw new Error(data.message || 'Failed to create transfer recipient');
  return data.data;
}

export async function initiateTransfer({ amount, recipientCode, reference, reason }) {
  const res = await fetch('/api/paystack-transfer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'balance',
      amount: Math.round(amount * 100), // convert naira to kobo
      recipient: recipientCode,
      reference,
      reason,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.status) throw new Error(data.message || 'Transfer initiation failed');
  return data.data;
}

export async function verifyTransfer(reference) {
  const res = await fetch(`/api/paystack-verify-transfer?reference=${reference}`);
  const data = await res.json();
  if (!res.ok || !data.status) throw new Error(data.message || 'Transfer verification failed');
  return data.data;
}
