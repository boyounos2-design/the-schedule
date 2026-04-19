import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Save, UserPlus, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/client';
import { SHIFT_TYPES, getMonthString, formatMonthDisplay } from '../utils/constants';
import toast from 'react-hot-toast';

const MONTHS = Array.from({ length: 6 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() + i);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
});

const EMPTY_FORM = { name: '', email: '', password: '', specialty: '' };
const EMPTY_QUOTA = { morning_er: 4, evening_er: 2, morning_dept: 3, evening_dept: 2, surgeries: 4, clinics: 5 };

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'quota' | 'delete'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [quota, setQuota] = useState(EMPTY_QUOTA);
  const [quotaMonth, setQuotaMonth] = useState(getMonthString());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/doctors');
      setDoctors(res.data.doctors);
    } catch (err) {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (doc) => {
    setSelected(doc);
    setForm({ name: doc.name, username: doc.username, specialty: doc.specialty || '', password: '' });
    setModal('edit');
  };

  const openQuota = async (doc) => {
    setSelected(doc);
    setModal('quota');
    try {
      const res = await api.get(`/doctors/${doc.id}/quotas?month=${quotaMonth}`);
      const q = res.data.quota;
      setQuota({ morning_er: q.morning_er || 0, evening_er: q.evening_er || 0, morning_dept: q.morning_dept || 0, evening_dept: q.evening_dept || 0, surgeries: q.surgeries || 0, clinics: q.clinics || 0 });
    } catch { setQuota(EMPTY_QUOTA); }
  };

  const openDelete = (doc) => { setSelected(doc); setModal('delete'); };

  const handleAdd = async () => {
    if (!form.name || !form.username || !form.password) { toast.error('Fill all required fields'); return; }
    setSaving(true);
    try {
      await api.post('/doctors', form);
      toast.success('Doctor added successfully');
      setModal(null); setForm(EMPTY_FORM); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to add doctor'); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/doctors/${selected.id}`, form);
      toast.success('Doctor updated');
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/doctors/${selected.id}`);
      toast.success('Doctor removed');
      setModal(null); load();
    } catch (err) { toast.error('Failed to delete'); }
    finally { setSaving(false); }
  };

  const handleSaveQuota = async () => {
    setSaving(true);
    try {
      await api.put(`/doctors/${selected.id}/quotas`, { month: quotaMonth, ...quota });
      toast.success(`Quota saved for ${formatMonthDisplay(quotaMonth)}`);
      setModal(null);
    } catch (err) { toast.error('Failed to save quota'); }
    finally { setSaving(false); }
  };

  const handleQuotaMonthChange = async (m) => {
    setQuotaMonth(m);
    if (!selected) return;
    try {
      const res = await api.get(`/doctors/${selected.id}/quotas?month=${m}`);
      const q = res.data.quota;
      setQuota({ morning_er: q.morning_er || 0, evening_er: q.evening_er || 0, morning_dept: q.morning_dept || 0, evening_dept: q.evening_dept || 0, surgeries: q.surgeries || 0, clinics: q.clinics || 0 });
    } catch { setQuota(EMPTY_QUOTA); }
  };

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.specialty || '').toLowerCase().includes(search.toLowerCase())
  );

  const closeModal = () => { setModal(null); setSelected(null); setForm(EMPTY_FORM); };
  const updateForm = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Doctors</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>{doctors.length} registered doctors</p>
            </div>
            <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setModal('add'); }}>
              <UserPlus size={16} /> Add Doctor
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Search by name or specialty..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Doctors list */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 10 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👨‍⚕️</div>
              <p style={{ fontSize: 16, fontWeight: 600 }}>No doctors found</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Add a doctor to get started</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(doc => (
                <div key={doc.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', flexWrap: 'wrap' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 16, color: 'white', flexShrink: 0,
                  }}>
                    {doc.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{doc.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      @{doc.username} {doc.specialty && `· ${doc.specialty}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openQuota(doc)} title="Set Quota">
                      📊 Quota
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(doc)} title="Edit">
                      <Pencil size={13} />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => openDelete(doc)} title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>{modal === 'add' ? 'Add Doctor' : 'Edit Doctor'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={closeModal} style={{ padding: 6 }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="label">Full Name *</label>
                <input className="input" placeholder="Dr. John Smith" value={form.name} onChange={e => updateForm('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Username *</label>
                <input className="input" type="text" placeholder="dr.smith" value={form.username} onChange={e => updateForm('username', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">{modal === 'add' ? 'Password *' : 'New Password (leave blank to keep)'}</label>
                <input className="input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => updateForm('password', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Specialty</label>
                <input className="input" placeholder="e.g. Emergency Medicine" value={form.specialty} onChange={e => updateForm('specialty', e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" onClick={modal === 'add' ? handleAdd : handleEdit} disabled={saving}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal === 'quota' && selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>Set Quota — {selected.name}</h2>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>Monthly shift allocations</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={closeModal} style={{ padding: 6 }}><X size={16} /></button>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="label">Month</label>
              <select className="input select" value={quotaMonth} onChange={e => handleQuotaMonthChange(e.target.value)}>
                {MONTHS.map(m => (
                  <option key={m} value={m}>{formatMonthDisplay(m)}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {SHIFT_TYPES.map(shift => (
                <div key={shift.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{shift.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{shift.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ width: 28, height: 28, padding: 0, justifyContent: 'center' }}
                      onClick={() => setQuota(q => ({ ...q, [shift.key]: Math.max(0, (q[shift.key] || 0) - 1) }))}
                    >−</button>
                    <span style={{ width: 28, textAlign: 'center', fontWeight: 700, fontSize: 16 }}>{quota[shift.key] || 0}</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ width: 28, height: 28, padding: 0, justifyContent: 'center' }}
                      onClick={() => setQuota(q => ({ ...q, [shift.key]: (q[shift.key] || 0) + 1 }))}
                    >+</button>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 4, paddingTop: 12, borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>Total Assigned Hours</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-primary)' }}>
                  {SHIFT_TYPES.reduce((sum, s) => sum + ((quota[s.key] || 0) * (s.hours || 12)), 0)}h
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveQuota} disabled={saving}>
                <Save size={14} /> {saving ? 'Saving...' : 'Save Quota'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'delete' && selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Delete Doctor</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 20, fontSize: 14 }}>
              Are you sure you want to remove <strong style={{ color: 'var(--color-text)' }}>{selected.name}</strong>?
              This will also delete all their schedules and quotas.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                <Trash2 size={14} /> {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
