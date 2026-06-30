import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, AlertCircle, Search } from 'lucide-react';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import { BANK_LIST, getBankCode, verifyAccount } from '../../lib/paystack';

export default function BankAccountFields({ bankName, accountNumber, onBankChange, onAccountChange, bankError, accountError }) {
  const [query, setQuery] = useState(bankName || '');
  const [open, setOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(null); // { account_name } | null
  const [verifyError, setVerifyError] = useState('');
  const dropdownRef = useRef(null);

  // Sync query when bankName changes externally
  useEffect(() => {
    setQuery(bankName || '');
  }, [bankName]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        // If user typed but didn't select, restore last valid bankName
        setQuery(bankName || '');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bankName]);

  const filtered = BANK_LIST.filter((b) =>
    b.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleBankSelect = (bank) => {
    setQuery(bank.name);
    setOpen(false);
    setVerified(null);
    setVerifyError('');
    onBankChange(bank.name);
    // Re-verify if account number is already 10 digits
    if (/^\d{10}$/.test(accountNumber)) {
      triggerVerify(accountNumber, bank.code);
    }
  };

  const triggerVerify = async (accNum, bankCode) => {
    if (!bankCode) return;
    setVerifying(true);
    setVerified(null);
    setVerifyError('');
    try {
      const result = await verifyAccount(accNum, bankCode);
      setVerified(result);
    } catch (err) {
      setVerifyError(err.message || 'Could not verify account');
    } finally {
      setVerifying(false);
    }
  };

  const handleAccountChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    onAccountChange(val);
    setVerified(null);
    setVerifyError('');
    if (val.length === 10) {
      const code = getBankCode(bankName);
      if (code) triggerVerify(val, code);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Searchable bank dropdown */}
      <div className="flex flex-col gap-1.5" ref={dropdownRef}>
        <label className="text-sm font-medium text-slate-700">Bank Name</label>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search bank…"
            className={cn(
              'w-full pl-8 pr-3 py-2 text-sm border rounded-lg bg-white text-slate-800 placeholder:text-slate-400',
              'focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary transition-colors',
              bankError ? 'border-danger' : 'border-slate-200'
            )}
          />
          {open && filtered.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-modal max-h-52 overflow-y-auto">
              {filtered.map((b) => (
                <li
                  key={b.code}
                  onMouseDown={() => handleBankSelect(b)}
                  className={cn(
                    'px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 hover:text-primary',
                    bankName === b.name && 'bg-primary-50 text-primary font-medium'
                  )}
                >
                  {b.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        {bankError && <span className="text-xs text-danger-600">{bankError}</span>}
      </div>

      {/* Account number with inline verification */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Account Number</label>
        <input
          type="text"
          value={accountNumber}
          onChange={handleAccountChange}
          placeholder="10-digit NUBAN"
          maxLength={10}
          inputMode="numeric"
          className={cn(
            'w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-800 placeholder:text-slate-400 font-mono',
            'focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary transition-colors',
            accountError ? 'border-danger' : verified ? 'border-success' : 'border-slate-200'
          )}
        />
        {verifying && (
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Loader2 size={12} className="animate-spin" /> Verifying account…
          </span>
        )}
        {verified && (
          <span className="flex items-center gap-1.5 text-xs text-success-700 font-medium">
            <CheckCircle2 size={12} /> {verified.account_name}
          </span>
        )}
        {verifyError && (
          <span className="flex items-center gap-1.5 text-xs text-warning-700">
            <AlertCircle size={12} /> {verifyError}
          </span>
        )}
        {accountError && !verifyError && <span className="text-xs text-danger-600">{accountError}</span>}
      </div>
    </div>
  );
}
