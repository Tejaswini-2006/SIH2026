import React, { useState } from 'react';
import {
  Settings,
  UserCheck,
  Calendar,
  Sliders,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DemoRole, AcademicYear, RiskRuleWeights } from '../../types';

export const SettingsView: React.FC = () => {
  const {
    settings,
    setRole,
    setAcademicYear,
    updateRuleWeights,
    updateTolerance,
    setActiveInstitutionForAdmin,
    resetAllData,
    institutions,
  } = useApp();

  const [weights, setWeights] = useState<RiskRuleWeights>(settings.ruleWeights);
  const [tolerance, setTolerance] = useState<number>(settings.intakeTolerancePercentage);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const roles: Array<{ role: DemoRole; desc: string; scope: string }> = [
    {
      role: 'AICTE Analyst',
      desc: 'Central council analyst tasked with statewide admission scrutiny, intake utilization monitoring, and validation exception triaging.',
      scope: 'Full cross-institution access, scoring weights, exceptions queue, report downloads',
    },
    {
      role: 'Institution Administrator',
      desc: 'College registrar or examination controller uploading annual student admission manifests and responding to regulatory notices.',
      scope: 'Restricted view to designated college, batch CSV submission, institutional response logs',
    },
    {
      role: 'Regulatory Auditor',
      desc: 'High-level inquiry officer investigating cross-state duplicate candidates, capacity violations, and recording reasoned overrides.',
      scope: 'Deep inquiry cases, showcause issuances, priority overrides, council referral',
    },
  ];

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    updateRuleWeights(weights);
    updateTolerance(tolerance);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const totalWeight =
    weights.intakeOverrun +
    weights.duplicateEnrolment +
    weights.exceptionDensity +
    weights.lateSubmission +
    weights.corroborationGap;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title & Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Settings & Demo Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure simulated demonstration personas, active review cycles, and risk scoring rule parameters.
          </p>
        </div>

        <button
          onClick={() => setResetConfirm(true)}
          className="self-start md:self-auto px-3.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Demo Data</span>
        </button>
      </div>

      {/* Role Switcher Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <UserCheck className="w-4 h-4 text-blue-600" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Demo Persona / Role Simulator</h3>
            <p className="text-xs text-slate-500">
              Select an active demo persona to preview role-tailored permissions and actions. (UI simulation only; no production auth).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {roles.map((r) => {
            const isSelected = settings.currentRole === r.role;
            return (
              <div
                key={r.role}
                onClick={() => setRole(r.role)}
                className={`p-4 rounded-lg border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 shadow-2xs ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{r.role}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">{r.desc}</p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 font-mono">
                  {r.scope}
                </div>
              </div>
            );
          })}
        </div>

        {/* Institution Administrator specific mapping */}
        {settings.currentRole === 'Institution Administrator' && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              <span className="text-slate-700 font-medium">Designated Institution for Admin:</span>
            </div>
            <select
              value={settings.activeInstitutionIdForAdmin}
              onChange={(e) => setActiveInstitutionForAdmin(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded font-medium text-slate-800"
            >
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Review Cycle & Validation Parameters */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Calendar className="w-4 h-4 text-blue-600" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Review Cycle & Tolerance Parameters</h3>
            <p className="text-xs text-slate-500">Configure regulatory academic year and admission variance thresholds.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Active Council Review Cycle</label>
            <select
              value={settings.activeAcademicYear}
              onChange={(e) => setAcademicYear(e.target.value as AcademicYear)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
            >
              <option value="2024-25">Academic Year 2024-25 (Current Active Cycle)</option>
              <option value="2023-24">Academic Year 2023-24 (Audited)</option>
              <option value="2025-26">Academic Year 2025-26 (Advance Planning)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">Changes scope of active dashboard metrics.</p>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Approved Intake Tolerance Threshold ({tolerance}%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={tolerance}
                onChange={(e) => setTolerance(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <span className="font-mono font-semibold text-slate-800 w-12 text-right">{tolerance.toFixed(1)}%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {tolerance === 0 ? 'Strict 0% limit: Any seat over approved quota triggers exception.' : `Allows up to +${tolerance}% margin for spot admission adjustments.`}
            </p>
          </div>
        </div>
      </div>

      {/* Rule Scoring Weights Configuration Form */}
      <form onSubmit={handleSaveWeights} className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Deterministic Risk Indicator Weights</h3>
              <p className="text-xs text-slate-500">
                Updating these rule weights immediately recalculates review priority scores across all demo institutions.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-700">
            Total Weight: <strong className={totalWeight === 100 ? 'text-emerald-700' : 'text-amber-700'}>{totalWeight}%</strong>
          </span>
        </div>

        <div className="space-y-3.5 text-xs">
          <div>
            <div className="flex justify-between font-medium text-slate-700 mb-1">
              <span>Approved Intake Overrun Weight</span>
              <span className="font-mono">{weights.intakeOverrun}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={weights.intakeOverrun}
              onChange={(e) => setWeights({ ...weights, intakeOverrun: parseInt(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between font-medium text-slate-700 mb-1">
              <span>Cross-Institution Duplicate Enrolment Weight</span>
              <span className="font-mono">{weights.duplicateEnrolment}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={weights.duplicateEnrolment}
              onChange={(e) => setWeights({ ...weights, duplicateEnrolment: parseInt(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between font-medium text-slate-700 mb-1">
              <span>Validation Exception Density Weight</span>
              <span className="font-mono">{weights.exceptionDensity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={weights.exceptionDensity}
              onChange={(e) => setWeights({ ...weights, exceptionDensity: parseInt(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between font-medium text-slate-700 mb-1">
              <span>Late Submissions & Revision Volume Weight</span>
              <span className="font-mono">{weights.lateSubmission}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={weights.lateSubmission}
              onChange={(e) => setWeights({ ...weights, lateSubmission: parseInt(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between font-medium text-slate-700 mb-1">
              <span>Corroboration Gaps (Simulated Adapter) Weight</span>
              <span className="font-mono">{weights.corroborationGap}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={weights.corroborationGap}
              onChange={(e) => setWeights({ ...weights, corroborationGap: parseInt(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {savedSuccess ? (
            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Weights updated & scores recalculated!</span>
            </span>
          ) : (
            <span className="text-slate-400">All modifications are preserved in browser storage.</span>
          )}

          <button
            type="submit"
            className="px-4 py-2 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            Save Configuration Changes
          </button>
        </div>
      </form>

      {/* Reset Confirmation Modal */}
      {resetConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reset Demo State?</h3>
            <p className="text-xs text-slate-500">
              This will restore all 12 sample institutions, ~180 synthetic student records, initial exceptions, and default rule weights.
            </p>
            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setResetConfirm(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAllData();
                  setResetConfirm(false);
                }}
                className="px-3 py-1.5 font-medium text-white bg-rose-600 hover:bg-rose-700 rounded shadow-xs"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
