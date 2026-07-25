import { useState } from 'react';
import { motion } from 'framer-motion';
import { Siren, AlertCircle } from 'lucide-react';
import { adminClient } from '../../lib/api/adminClient';
import { useToast } from '../../context/ToastContext';

export default function EmergencyAccessPage() {
  const [formData, setFormData] = useState({
    target_officer_id: '', case_reference: '', justification: '', duration_minutes: 60,
  });
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleGrant = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminClient.grantEmergencyAccess(formData);
      addToast('Emergency access granted successfully', 'success');
      setFormData({ target_officer_id: '', case_reference: '', justification: '', duration_minutes: 60 });
    } catch (err) {
      addToast(err.message || 'Failed to grant emergency access', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2.5">
          <Siren className="w-5 h-5 text-red-400" />
          <h1 className="text-xl font-semibold text-white tracking-tight">Emergency Administrative Access</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1 ml-7">
          Grant temporary emergency access to classified case data with mandatory justification logging.
        </p>
      </motion.div>

      <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-xs text-red-300 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <strong className="text-red-200">Security Advisory:</strong> Emergency access grants are permanently recorded in the
          immutable audit log and subject to post-incident review by KSP Internal Affairs. All grants must include a valid
          case reference number and documented operational justification.
        </div>
      </div>

      <div className="max-w-lg">
        <form onSubmit={handleGrant} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Officer ID</label>
            <input type="text" required value={formData.target_officer_id}
              onChange={(e) => setFormData({ ...formData, target_officer_id: e.target.value })}
              placeholder="e.g. OFF-FIELD-003"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-accent focus:outline-none text-xs text-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Case Reference Number</label>
            <input type="text" required value={formData.case_reference}
              onChange={(e) => setFormData({ ...formData, case_reference: e.target.value })}
              placeholder="e.g. FIR/2026/BLR/CC/0042"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-accent focus:outline-none text-xs text-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Justification</label>
            <textarea required rows={3} value={formData.justification}
              onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
              placeholder="Provide operational justification for emergency access..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-accent focus:outline-none text-xs text-white resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Duration (minutes)</label>
            <input type="number" min={15} max={480} value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-accent focus:outline-none text-xs text-white" />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-lg shadow-red-600/20">
            {submitting ? 'Granting Access...' : 'Grant Emergency Access'}
          </button>
        </form>
      </div>
    </div>
  );
}
