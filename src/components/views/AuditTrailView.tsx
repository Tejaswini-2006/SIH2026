import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuditTrailEvent } from '../../types';

export const AuditTrailView: React.FC = () => {
  const { auditTrail } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return auditTrail.filter((event) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        event.id.toLowerCase().includes(q) ||
        event.affectedRef.toLowerCase().includes(q) ||
        event.details.toLowerCase().includes(q) ||
        event.actorName.toLowerCase().includes(q);

      const matchesCategory = selectedCategory === 'all' || event.actionCategory === selectedCategory;
      const matchesRole = selectedRole === 'all' || event.actorRole === selectedRole;

      return matchesSearch && matchesCategory && matchesRole;
    });
  }, [auditTrail, searchQuery, selectedCategory, selectedRole]);

  const categories = [
    'Submission',
    'Validation',
    'Exception',
    'Correction',
    'Case Management',
    'Risk Override',
    'Report Export',
    'Settings',
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Audit Log & Traceability Trail</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable chronological event log capturing user submissions, rule evaluations, case milestones, and score overrides.
          </p>
        </div>

        <span className="self-start md:self-auto text-xs font-mono text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
          {auditTrail.length} Logged Trail Entries
        </span>
      </div>

      {/* Audit Policy Notice */}
      <div className="p-3 bg-slate-100 border border-slate-200/90 rounded-lg text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            <strong>Local Audit Integrity:</strong> All user mutations and rule evaluations are recorded locally in the browser runtime. In production, these records would stream to a certified WORM audit vault.
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reference, actor, or detail text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by action category"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 cursor-pointer"
            >
              <option value="all">All Action Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              aria-label="Filter by actor role"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="AICTE Analyst">AICTE Analyst</option>
              <option value="Regulatory Auditor">Regulatory Auditor</option>
              <option value="Institution Administrator">Institution Administrator</option>
              <option value="Automated Rule Engine">Automated Rule Engine</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold select-none">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor & Persona</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Affected Ref</th>
                <th className="px-4 py-3">Event Detail & Context</th>
                <th className="px-4 py-3 text-right">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit trail logs match your filter parameters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {ev.timestamp}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{ev.actorName}</div>
                      <div className="text-[10px] text-slate-400">{ev.actorRole}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {ev.actionCategory}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {ev.affectedRef}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-md">
                      {ev.details}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          ev.outcome === 'Success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ev.outcome === 'Flagged'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : ev.outcome === 'Modified'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {ev.outcome}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
