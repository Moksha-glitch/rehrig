import React, { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icon.jsx";
import {
  Button,
  Page,
  PageHeader,
  SearchField,
  Select,
} from "../components/UI.jsx";
import { useStore } from "../state/AppStore.jsx";
import { useAccounts, useSegments } from "../hooks/useAccounts.js";
import { SEED_PROFILES } from "../data/profileAccess.js";
import ProfileForm from "./ProfileForm.jsx";

const PROFILES_KEY = "vision.ui.profiles";

function readProfiles() {
  try {
    const raw = window.localStorage.getItem(PROFILES_KEY);
    if (!raw) return SEED_PROFILES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : SEED_PROFILES;
  } catch {
    return SEED_PROFILES;
  }
}

function writeProfiles(profiles) {
  try {
    window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch {}
}

function todayLabel() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

// Fixed neutral-professional palette — each role gets a consistent slot
const AVATAR_PALETTE = [
  { bg: '#3B5998', shadow: 'rgba(59,89,152,0.30)' },   // navy
  { bg: '#2E7D5E', shadow: 'rgba(46,125,94,0.30)' },   // forest
  { bg: '#5A4A8A', shadow: 'rgba(90,74,138,0.30)' },   // plum
  { bg: '#7A5230', shadow: 'rgba(122,82,48,0.30)' },   // chestnut
  { bg: '#2C6E8A', shadow: 'rgba(44,110,138,0.30)' },  // steel blue
  { bg: '#6B3A3A', shadow: 'rgba(107,58,58,0.30)' },   // burgundy
  { bg: '#3A6B4A', shadow: 'rgba(58,107,74,0.30)' },   // sage
  { bg: '#4A5568', shadow: 'rgba(74,85,104,0.30)' },   // slate
];

function roleAvatar(role) {
  const words = (role || '').trim().split(/\s+/);
  const initials =
    words.length >= 2
      ? `${words[0][0]}${words[words.length - 1][0]}`
      : (words[0] || 'P').slice(0, 2);
  const idx = [...(role || '')].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % AVATAR_PALETTE.length;
  return { initials: initials.toUpperCase(), palette: AVATAR_PALETTE[idx] };
}

function accessChips(access) {
  const chips = [];
  if (/all access/i.test(access)) {
    chips.push({ label: "Full access", color: "brand" });
  } else if (/partial/i.test(access)) {
    chips.push({ label: "Partial", color: "accent" });
  } else if (/mobile/i.test(access)) {
    chips.push({ label: "Mobile only", color: "slate" });
  } else if (/view only/i.test(access)) {
    chips.push({ label: "View only", color: "slate" });
  }
  const spMatch = access.match(/SP:\s*(\d+)/i);
  if (spMatch) chips.push({ label: `${spMatch[1]} providers`, color: "slate" });
  else if (/SP:\s*all/i.test(access)) chips.push({ label: "All providers", color: "brand" });
  return chips;
}

const CHIP_STYLES = {
  brand: "bg-brand-soft text-brand-ink border-brand/20",
  accent: "bg-accent-soft text-accent border-amber-300/30",
  slate: "bg-elevated text-ink-muted border-line",
};

function AccessChip({ label, color }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${CHIP_STYLES[color || "slate"]}`}
    >
      {label}
    </span>
  );
}

function AvatarInitials({ role }) {
  const { initials, palette } = roleAvatar(role);
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold text-white select-none"
      style={{
        background: palette.bg,
        boxShadow: `0 2px 8px ${palette.shadow}`,
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

function ProfileCard({ profile, onClick, index }) {
  const chips = accessChips(profile.access || '');
  const isActive = profile.status === 'Active';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-xl border border-line bg-surface text-left transition-all duration-200 hover:border-brand/40 hover:shadow-[0_4px_20px_rgba(11,79,125,0.08)] hover:-translate-y-px active:translate-y-0 animate-fade-up"
      style={{ animationDelay: `${index * 35}ms` }}
    >
      <div className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-brand/40" />
      <div className="flex items-start gap-3.5 p-4">
        <AvatarInitials role={profile.role} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="block truncate text-sm font-semibold text-ink leading-snug">
              {profile.role}
            </span>
            <span
              className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                isActive ? "bg-success-soft text-success" : "bg-elevated text-ink-faint"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-success" : "bg-ink-faint"}`} />
              {profile.status}
            </span>
          </div>
          {profile.description && (
            <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-muted">
              {profile.description}
            </p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {chips.map((chip) => (
              <AccessChip key={chip.label} label={chip.label} color={chip.color} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-line/60 bg-elevated/30 px-4 py-2">
        <span className="text-[11px] text-ink-faint">
          {profile.created} · {profile.createdDate}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">
          Edit <Icon name="chevronRight" size={11} />
        </span>
      </div>
    </button>
  );
}

function ProfileTableRow({ profile, onClick }) {
  const chips = accessChips(profile.access || "");
  const isActive = profile.status === "Active";
  return (
    <tr
      className="group cursor-pointer border-b border-line/60 transition-colors hover:bg-elevated/50"
      onClick={onClick}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <AvatarInitials role={profile.role} />
          <div>
            <div className="text-sm font-semibold text-ink leading-snug">{profile.role}</div>
            {profile.description && (
              <div className="mt-0.5 max-w-xs truncate text-[12px] text-ink-muted">
                {profile.description}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <AccessChip key={chip.label} label={chip.label} color={chip.color} />
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            isActive ? "bg-success-soft text-success" : "bg-elevated text-ink-faint"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-success" : "bg-ink-faint"}`} />
          {profile.status}
        </span>
      </td>
      <td className="px-4 py-3 text-[12px] text-ink-muted">
        {profile.created} · {profile.createdDate}
      </td>
      <td className="px-4 py-3 text-[12px] text-ink-muted">
        {profile.lastUpdatedBy} · {profile.lastUpdatedDate}
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 rounded-lg border border-line bg-elevated px-2.5 py-1 text-[11px] font-medium text-ink-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-ink">
          <Icon name="pencil" size={11} /> Edit
        </span>
      </td>
    </tr>
  );
}

export default function ProfileManagement() {
  const { state, toast } = useStore();
  const accountsQuery = useAccounts();
  const segmentsQuery = useSegments();
  const [profiles, setProfiles] = useState(readProfiles);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    writeProfiles(profiles);
  }, [profiles]);

  const accounts = accountsQuery.data || [];
  const segments = segmentsQuery.data || [];
  const actor = state.currentUser?.name || "You";

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return profiles.filter((profile) => {
      if (statusFilter !== "all" && profile.status !== statusFilter) return false;
      if (!term) return true;
      return [profile.role, profile.access, profile.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [profiles, query, statusFilter]);

  const activeCount = profiles.filter((p) => p.status === "Active").length;
  const inactiveCount = profiles.filter((p) => p.status === "Inactive").length;

  const saveProfile = (next) => {
    const stamp = { lastUpdatedBy: actor, lastUpdatedDate: todayLabel() };
    setProfiles((prev) => {
      if (next.id) {
        return prev.map((p) => (p.id === next.id ? { ...p, ...next, ...stamp } : p));
      }
      return [{ ...next, id: `vp-${Date.now().toString(36)}`, created: actor, createdDate: todayLabel(), ...stamp }, ...prev];
    });
    toast(next.id ? "Profile saved" : "Profile created");
    setEditing(null);
  };

  const deleteProfile = (profile) => {
    setProfiles((prev) => prev.filter((item) => item.id !== profile.id));
    toast("Profile deleted");
    setEditing(null);
  };

  return (
    <Page wide>
      <PageHeader
        overline="Configure"
        title="Profile Management"
        description="Define permission sets that control what each user role can see and edit across the platform."
        actions={
          <Button variant="primary" onClick={() => setEditing({})}>
            <Icon name="plus" size={14} /> New Profile
          </Button>
        }
      />

      {/* Stat strip */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Total profiles", value: profiles.length, icon: "shieldCheck", color: "brand" },
          { label: "Active", value: activeCount, icon: "check", color: "success" },
          { label: "Inactive", value: inactiveCount, icon: "x", color: "muted" },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="flex items-center gap-3.5 rounded-xl border border-line bg-surface p-4 shadow-raise animate-fade-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                stat.color === "brand"
                  ? "bg-brand-soft text-brand"
                  : stat.color === "success"
                  ? "bg-success-soft text-success"
                  : "bg-elevated text-ink-faint"
              }`}
            >
              <Icon name={stat.icon} size={16} />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                {stat.label}
              </p>
              <p className="mt-0.5 font-display text-2xl font-semibold tabular-nums text-ink leading-none">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          options={[
            { value: "all", label: "All statuses" },
            { value: "Active", label: "Active" },
            { value: "Inactive", label: "Inactive" },
          ]}
        />
        <SearchField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search profiles…"
          label="Search profiles"
        />
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[12px] font-medium text-ink-muted">
            {filtered.length} profile{filtered.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center rounded-lg border border-line bg-elevated p-0.5">
            {[
              { mode: "grid", icon: "grid", label: "Grid view" },
              { mode: "table", icon: "list", label: "Table view" },
            ].map(({ mode, icon, label }) => (
              <button
                key={mode}
                type="button"
                aria-label={label}
                onClick={() => setViewMode(mode)}
                className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                  viewMode === mode
                    ? "bg-surface text-ink shadow-raise"
                    : "text-ink-faint hover:text-ink-muted"
                }`}
              >
                <Icon name={icon} size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid view */}
      {viewMode === "grid" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((profile, i) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              index={i}
              onClick={() => setEditing(profile)}
            />
          ))}
          {!filtered.length && (
            <div className="col-span-full flex flex-col items-center gap-2 py-20 text-ink-faint">
              <Icon name="search" size={32} />
              <p className="text-sm">No profiles match these filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Table view */}
      {viewMode === "table" && (
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-raise">
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-elevated/50">
                  {["Profile", "Access", "Status", "Created", "Last updated", ""].map((col, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((profile) => (
                  <ProfileTableRow
                    key={profile.id}
                    profile={profile}
                    onClick={() => setEditing(profile)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {!filtered.length && (
            <div className="py-16 text-center text-sm text-ink-muted">
              No profiles match these filters.
            </div>
          )}
        </div>
      )}

      {editing && (
        <ProfileForm
          profile={editing.id ? editing : null}
          profiles={profiles}
          accounts={accounts}
          segments={segments}
          onClose={() => setEditing(null)}
          onSave={saveProfile}
          onDelete={deleteProfile}
        />
      )}
    </Page>
  );
}
