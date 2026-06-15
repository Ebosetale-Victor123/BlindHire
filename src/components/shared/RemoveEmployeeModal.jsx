import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Select } from '../ui/Input';

const REMOVAL_REASONS = ['Resignation', 'Termination', 'Contract Ended', 'Retirement', 'Other'];

export default function RemoveEmployeeModal({ open, employee, onClose, onConfirm }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Remove Employee"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" disabled={!reason} onClick={() => onConfirm(reason)}>
            Remove Employee
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          This will permanently remove{' '}
          <span className="font-semibold text-slate-800">
            {employee?.first_name} {employee?.last_name}
          </span>{' '}
          from the system. This action cannot be undone.
        </p>
        <Select label="Reason for Removal" value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="" disabled hidden>
            Select a reason
          </option>
          {REMOVAL_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </div>
    </Modal>
  );
}
