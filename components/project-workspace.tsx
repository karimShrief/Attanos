"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clipboard,
  Copy,
  FileText,
  Heart,
  Lock,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  UploadCloud,
  Wand2
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { getProjectStatus } from "@/lib/status";
import { validateBriefInput } from "@/lib/validation";
import type { BriefFormState, CampaignOutput, CreativeBrief, OutputType, Project } from "@/types/app";

type TabKey =
  | "creative"
  | "headlines"
  | "captions"
  | "scripts"
  | "lead_forms"
  | "proofreading"
  | "design_review";

const tabs: Array<{
  key: TabKey;
  label: string;
  outputType?: OutputType;
  route?: string;
}> = [
  { key: "creative", label: "Creative Gate" },
  {
    key: "headlines",
    label: "Headlines",
    outputType: "headlines",
    route: "/api/generate-headlines"
  },
  {
    key: "captions",
    label: "Captions",
    outputType: "captions",
    route: "/api/generate-captions"
  },
  {
    key: "scripts",
    label: "Scripts",
    outputType: "scripts",
    route: "/api/generate-scripts"
  },
  {
    key: "lead_forms",
    label: "Lead Forms",
    outputType: "lead_forms",
    route: "/api/generate-lead-forms"
  },
  {
    key: "proofreading",
    label: "Proofreading",
    outputType: "proofreading",
    route: "/api/proofread"
  },
  {
    key: "design_review",
    label: "Design Review",
    outputType: "design_review"
  }
];

const proofModes = [
  "Luxury polish",
  "Direct response polish",
  "Arabic correction",
  "English correction",
  "Bilingual cleanup",
  "Make it sound more human",
  "Remove generic AI language",
  "Make it sharper"
];

export function ProjectWorkspace({
  project,
  projects,
  initialBrief,
  initialOutputs
}: {
  project: Project;
  projects: Project[];
  initialBrief: CreativeBrief | null;
  initialOutputs: CampaignOutput[];
}) {
  const [brief, setBrief] = useState<CreativeBrief | null>(initialBrief);
  const [briefForm, setBriefForm] = useState<BriefFormState>(() => briefToForm(initialBrief));
  const [outputs, setOutputs] = useState<CampaignOutput[]>(initialOutputs);
  const [activeTab, setActiveTab] = useState<TabKey>("creative");
  const [loading, setLoading] = useState<string | null>(null);
  const [gateErrors, setGateErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [proofText, setProofText] = useState("");
  const [proofMode, setProofMode] = useState(proofModes[0]);

  const unlocked = Boolean(brief?.unlock_generation);
  const status = useMemo(() => getProjectStatus(brief), [brief]);
  const activeTabConfig = tabs.find((tab) => tab.key === activeTab) || tabs[0];

  function updateBriefField(key: keyof BriefFormState, value: string) {
    setBriefForm((current) => ({ ...current, [key]: value }));
  }

  async function evaluateBrief() {
    setError("");
    setNotice("");
    const validationErrors = validateBriefInput(briefForm);
    setGateErrors(validationErrors);

    if (validationErrors.length) {
      return;
    }

    setLoading("evaluate");

    try {
      const response = await fetch("/api/evaluate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          briefId: brief?.id,
          brief: briefForm
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not evaluate the Creative Gate.");
      }

      setBrief(payload.brief);
      setGateErrors([]);
      setNotice(
        payload.brief.unlock_generation
          ? "Creative Gate passed. Campaign assets are now unlocked."
          : "Your idea is not strong enough yet. Strengthen the buyer tension, emotional trigger, differentiation, or desired action."
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not evaluate the Creative Gate.");
    } finally {
      setLoading(null);
    }
  }

  async function generateOutput(tab: (typeof tabs)[number]) {
    if (!tab.outputType || !tab.route) {
      return;
    }

    setError("");
    setNotice("");
    setLoading(tab.key);

    try {
      const response = await fetch(tab.route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Generation failed.");
      }

      setOutputs((current) => [payload.output, ...current]);
      setNotice("Output generated and saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Generation failed.");
    } finally {
      setLoading(null);
    }
  }

  async function proofread() {
    if (!proofText.trim()) {
      setError("Paste text before proofreading.");
      return;
    }

    setError("");
    setNotice("");
    setLoading("proofreading");

    try {
      const response = await fetch("/api/proofread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          text: proofText,
          mode: proofMode
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Proofreading failed.");
      }

      setOutputs((current) => [payload.output, ...current]);
      setNotice("Proofread output saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Proofreading failed.");
    } finally {
      setLoading(null);
    }
  }

  async function copyOutput(output: CampaignOutput) {
    await navigator.clipboard.writeText(outputToPlainText(output.content));
    setCopiedId(output.id);
    window.setTimeout(() => setCopiedId(null), 1600);
  }

  async function toggleFavorite(output: CampaignOutput) {
    const nextFavorite = !output.is_favorite;
    setOutputs((current) =>
      current.map((item) =>
        item.id === output.id ? { ...item, is_favorite: nextFavorite } : item
      )
    );

    const response = await fetch("/api/favorite-output", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outputId: output.id, isFavorite: nextFavorite })
    });

    if (!response.ok) {
      setOutputs((current) =>
        current.map((item) =>
          item.id === output.id ? { ...item, is_favorite: output.is_favorite } : item
        )
      );
      setError("Could not update favorite status.");
    }
  }

  async function deleteOutput(output: CampaignOutput) {
    const previous = outputs;
    setOutputs((current) => current.filter((item) => item.id !== output.id));

    const response = await fetch("/api/delete-output", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outputId: output.id })
    });

    if (!response.ok) {
      setOutputs(previous);
      setError("Could not delete output.");
    }
  }

  const activeOutputs = activeTabConfig.outputType
    ? outputs.filter((output) => output.type === activeTabConfig.outputType)
    : [];

  return (
    <div className="min-h-screen px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[300px_1fr]">
        <WorkspaceSidebar currentProject={project} projects={projects} />
        <main className="space-y-5">
          <section className="border-b border-brass/16 pb-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="mb-2 text-sm font-semibold text-brass">ATTANOS Workspace</p>
                <h1 className="font-display text-4xl text-parchment md:text-6xl">
                  {project.name}
                </h1>
                <p className="mt-3 text-parchment/62">
                  Generation stays locked until your campaign idea is specific enough.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={status} />
                {brief?.idea_score !== null && brief?.idea_score !== undefined ? (
                  <span className="rounded-md border border-brass/20 bg-parchment/[0.04] px-3 py-1.5 text-sm text-parchment/72">
                    AI Score: {brief.idea_score}/100
                  </span>
                ) : null}
              </div>
            </div>
          </section>

          <ProjectSummary project={project} />

          <section className="overflow-x-auto border-b border-brass/16">
            <div className="flex min-w-max gap-2 pb-3">
              {tabs.map((tab) => {
                const locked = tab.key !== "creative" && !unlocked;
                const isActive = tab.key === activeTab;

                return (
                  <button
                    className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "border-brass bg-brass/14 text-parchment"
                        : "border-brass/14 bg-parchment/[0.035] text-parchment/62 hover:border-brass/36 hover:text-parchment"
                    }`}
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    type="button"
                  >
                    {locked ? <Lock aria-hidden="true" size={15} /> : null}
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </section>

          {notice ? (
            <p className="rounded-md border border-jade/40 bg-jade/10 px-4 py-3 text-sm text-[#b8e7d4]">
              {notice}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-md border border-oxide/50 bg-oxide/10 px-4 py-3 text-sm text-[#f0b49d]">
              {error}
            </p>
          ) : null}

          {activeTab === "creative" ? (
            <CreativeGatePanel
              brief={brief}
              form={briefForm}
              gateErrors={gateErrors}
              loading={loading === "evaluate"}
              onEvaluate={evaluateBrief}
              onUpdate={updateBriefField}
            />
          ) : !unlocked ? (
            <LockedPanel />
          ) : activeTab === "design_review" ? (
            <DesignReviewPanel />
          ) : activeTab === "proofreading" ? (
            <ProofreadingPanel
              activeOutputs={activeOutputs}
              copiedId={copiedId}
              loading={loading === "proofreading"}
              mode={proofMode}
              onCopy={copyOutput}
              onDelete={deleteOutput}
              onFavorite={toggleFavorite}
              onModeChange={setProofMode}
              onProofread={proofread}
              onTextChange={setProofText}
              text={proofText}
            />
          ) : (
            <GenerationPanel
              activeOutputs={activeOutputs}
              copiedId={copiedId}
              loading={loading === activeTab}
              onCopy={copyOutput}
              onDelete={deleteOutput}
              onFavorite={toggleFavorite}
              onGenerate={() => generateOutput(activeTabConfig)}
              tab={activeTabConfig}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function WorkspaceSidebar({
  currentProject,
  projects
}: {
  currentProject: Project;
  projects: Project[];
}) {
  return (
    <aside className="luxury-panel h-fit rounded-lg p-4 lg:sticky lg:top-5">
      <div className="mb-6 rounded-lg border border-brass/16 bg-ink/50 p-4">
        <div className="mb-3 flex items-center gap-2 text-brass">
          <UploadCloud aria-hidden="true" size={18} />
          <h2 className="font-display text-2xl text-parchment">Storage Vault</h2>
        </div>
        <p className="text-sm leading-6 text-parchment/56">
          Private upload storage is prepared for future campaign assets.
        </p>
      </div>

      <Link className="btn-primary mb-5 w-full" href="/dashboard/new">
        <Plus aria-hidden="true" size={17} />
        Create new campaign
      </Link>

      <div>
        <p className="mb-3 text-sm font-semibold text-brass">Project list</p>
        <nav className="space-y-2">
          {projects.map((item) => {
            const current = item.id === currentProject.id;

            return (
              <Link
                className={`block rounded-md border px-3 py-3 text-sm transition ${
                  current
                    ? "border-brass/60 bg-brass/12 text-parchment"
                    : "border-brass/12 bg-parchment/[0.025] text-parchment/60 hover:border-brass/40 hover:text-parchment"
                }`}
                href={`/projects/${item.id}`}
                key={item.id}
              >
                <span className="mb-1 block font-semibold">{item.name}</span>
                <span className="text-xs text-parchment/44">
                  {current ? "Current project" : item.location || "Open campaign"}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

function ProjectSummary({ project }: { project: Project }) {
  const summary = [
    ["Developer", project.developer],
    ["Location", project.location],
    ["Property type", project.property_type],
    ["Unit types", project.unit_types],
    ["Starting price", project.starting_price],
    ["Payment plan", project.payment_plan],
    ["Handover", project.handover_date],
    ["Language", project.language || "English"]
  ];

  return (
    <section className="grid gap-4 md:grid-cols-[1fr_1fr] xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-lg border border-brass/16 bg-parchment/[0.035] p-5">
        <h2 className="font-display text-2xl text-parchment">Project Intelligence</h2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {summary.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-parchment/42">{label}</dt>
              <dd className="mt-1 text-sm text-parchment/76">{value || "Not set"}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="rounded-lg border border-brass/16 bg-parchment/[0.035] p-5">
        <h2 className="font-display text-2xl text-parchment">Buyer Context</h2>
        <div className="mt-5 space-y-4 text-sm leading-6 text-parchment/72">
          <div>
            <p className="mb-1 text-xs text-parchment/42">Main USPs</p>
            <p>{project.main_usps || "Not set"}</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-parchment/42">Target audience</p>
            <p>{project.target_audience || "Not set"}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CreativeGatePanel({
  brief,
  form,
  gateErrors,
  loading,
  onEvaluate,
  onUpdate
}: {
  brief: CreativeBrief | null;
  form: BriefFormState;
  gateErrors: string[];
  loading: boolean;
  onEvaluate: () => void;
  onUpdate: (key: keyof BriefFormState, value: string) => void;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-lg border border-brass/16 bg-parchment/[0.035] p-5">
        <div className="mb-6">
          <h2 className="font-display text-3xl text-parchment">Creative Gate</h2>
          <p className="mt-2 text-sm leading-6 text-parchment/62">
            Generation stays locked until your campaign idea is specific enough.
          </p>
        </div>

        <div className="space-y-5">
          <GateField
            helper="What is the core creative concept behind this campaign?"
            label="Big Idea"
            minRows={4}
            onChange={(value) => onUpdate("big_idea", value)}
            value={form.big_idea}
          />
          <GateField
            helper="What buyer conflict or contradiction are we using?"
            label="Tension"
            minRows={3}
            onChange={(value) => onUpdate("tension", value)}
            value={form.tension}
          />
          <div className="grid gap-5 md:grid-cols-2">
            <GateField
              helper="What should the buyer feel?"
              label="Emotional Trigger"
              onChange={(value) => onUpdate("emotional_trigger", value)}
              value={form.emotional_trigger}
            />
            <GateField
              helper="What could stop the buyer from taking action?"
              label="Buyer Objection"
              onChange={(value) => onUpdate("buyer_objection", value)}
              value={form.buyer_objection}
            />
            <GateField
              helper="What does the buyer secretly want?"
              label="Hidden Desire"
              onChange={(value) => onUpdate("hidden_desire", value)}
              value={form.hidden_desire}
            />
            <GateField
              helper="Luxury, investment, family, location, lifestyle, scarcity, trust, quiet luxury, etc."
              label="Campaign Angle"
              onChange={(value) => onUpdate("campaign_angle", value)}
              value={form.campaign_angle}
            />
            <GateField
              helper="Book a viewing, request brochure, WhatsApp inquiry, register interest, etc."
              label="Desired Action"
              onChange={(value) => onUpdate("desired_action", value)}
              value={form.desired_action}
            />
            <GateField
              helper="Generic phrases, claims, tones, or words to avoid."
              label="Avoid List"
              onChange={(value) => onUpdate("avoid_list", value)}
              value={form.avoid_list}
            />
          </div>
        </div>

        {gateErrors.length ? (
          <div className="mt-5 rounded-md border border-oxide/50 bg-oxide/10 p-4 text-sm text-[#f0b49d]">
            <p className="mb-2 font-semibold">Before AI evaluation:</p>
            <ul className="space-y-1">
              {gateErrors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <button className="btn-primary mt-6" disabled={loading} onClick={onEvaluate} type="button">
          <Wand2 aria-hidden="true" size={18} />
          {loading ? "Evaluating idea..." : "Evaluate Creative Gate"}
          <ArrowRight aria-hidden="true" size={18} />
        </button>
      </div>

      <div className="rounded-lg border border-brass/16 bg-parchment/[0.035] p-5">
        <h2 className="font-display text-3xl text-parchment">AI Score</h2>
        {!brief || brief.idea_score === null ? (
          <p className="mt-4 text-sm leading-6 text-parchment/62">
            Complete the Creative Gate and ATTANOS will judge whether the strategic idea is strong
            enough to unlock generation.
          </p>
        ) : (
          <div className="mt-5 space-y-5">
            <div className="rounded-lg border border-brass/18 bg-ink/40 p-4">
              <p className="text-sm text-parchment/52">Total idea score</p>
              <p className="mt-2 font-display text-5xl text-parchment">{brief.idea_score}/100</p>
              <div className="mt-4">
                <StatusBadge status={getProjectStatus(brief)} />
              </div>
            </div>
            <ScoreRows brief={brief} />
            {brief.ai_feedback ? <Feedback feedback={brief.ai_feedback} /> : null}
          </div>
        )}
      </div>
    </section>
  );
}

function GateField({
  label,
  helper,
  value,
  onChange,
  minRows = 2
}: {
  label: string;
  helper: string;
  value: string;
  onChange: (value: string) => void;
  minRows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-parchment">{label}</span>
      <span className="mb-2 block text-xs leading-5 text-parchment/50">{helper}</span>
      <textarea
        className="field resize-y"
        onChange={(event) => onChange(event.target.value)}
        rows={minRows}
        value={value}
      />
    </label>
  );
}

function ScoreRows({ brief }: { brief: CreativeBrief }) {
  const rows = [
    ["Creative clarity", brief.creative_clarity_score],
    ["Buyer psychology", brief.buyer_psychology_score],
    ["Differentiation", brief.differentiation_score],
    ["Conversion readiness", brief.conversion_readiness_score]
  ];

  return (
    <div className="space-y-3">
      {rows.map(([label, score]) => (
        <div className="flex items-center justify-between border-b border-brass/12 pb-2" key={label}>
          <span className="text-sm text-parchment/60">{label}</span>
          <span className="font-semibold text-parchment">{score ?? 0}/25</span>
        </div>
      ))}
    </div>
  );
}

function Feedback({ feedback }: { feedback: NonNullable<CreativeBrief["ai_feedback"]> }) {
  return (
    <div className="space-y-4 text-sm leading-6">
      {feedback.summary ? <p className="text-parchment/72">{feedback.summary}</p> : null}
      <FeedbackList icon="check" title="Strengths" items={feedback.strengths} />
      <FeedbackList title="Weaknesses" items={feedback.weaknesses} />
      <FeedbackList title="Missing inputs" items={feedback.missing_inputs} />
      <FeedbackList title="Recommendations" items={feedback.recommendations} />
      {feedback.generic_phrase_warnings?.length ? (
        <FeedbackList title="Generic phrase warnings" items={feedback.generic_phrase_warnings} />
      ) : null}
    </div>
  );
}

function FeedbackList({
  title,
  items,
  icon
}: {
  title: string;
  items?: string[];
  icon?: "check";
}) {
  if (!items?.length) {
    return null;
  }

  return (
    <div>
      <p className="mb-2 font-semibold text-brass">{title}</p>
      <ul className="space-y-2 text-parchment/64">
        {items.map((item) => (
          <li className="flex gap-2" key={item}>
            {icon === "check" ? (
              <CheckCircle2 aria-hidden="true" className="mt-1 shrink-0 text-jade" size={15} />
            ) : (
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brass/70" />
            )}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LockedPanel() {
  return (
    <section className="rounded-lg border border-brass/18 bg-parchment/[0.035] p-8 text-center">
      <Lock aria-hidden="true" className="mx-auto text-brass" size={34} />
      <h2 className="mt-4 font-display text-3xl text-parchment">Generation locked</h2>
      <p className="mx-auto mt-3 max-w-xl leading-7 text-parchment/62">
        Complete and pass the Creative Gate to unlock this section.
      </p>
    </section>
  );
}

function GenerationPanel({
  tab,
  activeOutputs,
  copiedId,
  loading,
  onCopy,
  onDelete,
  onFavorite,
  onGenerate
}: {
  tab: (typeof tabs)[number];
  activeOutputs: CampaignOutput[];
  copiedId: string | null;
  loading: boolean;
  onCopy: (output: CampaignOutput) => void;
  onDelete: (output: CampaignOutput) => void;
  onFavorite: (output: CampaignOutput) => void;
  onGenerate: () => void;
}) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 rounded-lg border border-brass/16 bg-parchment/[0.035] p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-3xl text-parchment">{tab.label}</h2>
          <p className="mt-2 text-sm text-parchment/60">
            Uses the property intelligence, Creative Gate, and AI feedback as the source of truth.
          </p>
        </div>
        <button className="btn-primary" disabled={loading} onClick={onGenerate} type="button">
          {loading ? <RefreshCw aria-hidden="true" size={18} /> : <Sparkles aria-hidden="true" size={18} />}
          {loading ? "Generating..." : activeOutputs.length ? "Regenerate" : "Generate"}
        </button>
      </div>

      <OutputList
        copiedId={copiedId}
        emptyLabel={`No ${tab.label.toLowerCase()} saved yet.`}
        onCopy={onCopy}
        onDelete={onDelete}
        onFavorite={onFavorite}
        outputs={activeOutputs}
      />
    </section>
  );
}

function ProofreadingPanel({
  text,
  mode,
  activeOutputs,
  copiedId,
  loading,
  onTextChange,
  onModeChange,
  onProofread,
  onCopy,
  onDelete,
  onFavorite
}: {
  text: string;
  mode: string;
  activeOutputs: CampaignOutput[];
  copiedId: string | null;
  loading: boolean;
  onTextChange: (value: string) => void;
  onModeChange: (value: string) => void;
  onProofread: () => void;
  onCopy: (output: CampaignOutput) => void;
  onDelete: (output: CampaignOutput) => void;
  onFavorite: (output: CampaignOutput) => void;
}) {
  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-brass/16 bg-parchment/[0.035] p-5">
        <h2 className="font-display text-3xl text-parchment">Proofreading</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-parchment">Text to improve</span>
            <textarea
              className="field min-h-56 resize-y"
              onChange={(event) => onTextChange(event.target.value)}
              placeholder="Paste campaign copy, captions, brochure text, or WhatsApp copy..."
              value={text}
            />
          </label>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-parchment">Mode</span>
              <select
                className="field"
                onChange={(event) => onModeChange(event.target.value)}
                value={mode}
              >
                {proofModes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <button className="btn-primary w-full" disabled={loading} onClick={onProofread} type="button">
              {loading ? <RefreshCw aria-hidden="true" size={18} /> : <Clipboard aria-hidden="true" size={18} />}
              {loading ? "Improving..." : "Proofread"}
            </button>
          </div>
        </div>
      </div>

      <OutputList
        copiedId={copiedId}
        emptyLabel="No proofreading outputs saved yet."
        onCopy={onCopy}
        onDelete={onDelete}
        onFavorite={onFavorite}
        outputs={activeOutputs}
      />
    </section>
  );
}

function DesignReviewPanel() {
  return (
    <section className="rounded-lg border border-brass/16 bg-parchment/[0.035] p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-lg border border-brass/18 bg-ink/55 p-3 text-brass">
          <FileText aria-hidden="true" size={22} />
        </div>
        <div>
          <h2 className="font-display text-3xl text-parchment">Design Review</h2>
          <p className="mt-3 max-w-3xl leading-7 text-parchment/66">
            Upload-based design review will analyze clarity, hierarchy, CTA visibility, trust
            signals, luxury feel, readability, offer visibility, brand consistency, and mobile
            readability.
          </p>
          <p className="mt-4 text-sm text-parchment/46">
            Supabase Storage is prepared for future uploads in the private project vault.
          </p>
        </div>
      </div>
    </section>
  );
}

function OutputList({
  outputs,
  emptyLabel,
  copiedId,
  onCopy,
  onFavorite,
  onDelete
}: {
  outputs: CampaignOutput[];
  emptyLabel: string;
  copiedId: string | null;
  onCopy: (output: CampaignOutput) => void;
  onFavorite: (output: CampaignOutput) => void;
  onDelete: (output: CampaignOutput) => void;
}) {
  if (!outputs.length) {
    return (
      <div className="rounded-lg border border-brass/16 bg-parchment/[0.025] p-6 text-sm text-parchment/58">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {outputs.map((output) => (
        <article
          className="rounded-lg border border-brass/16 bg-parchment/[0.035] p-5"
          key={output.id}
        >
          <div className="mb-5 flex flex-col gap-3 border-b border-brass/12 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-brass">
                {output.is_favorite ? "Favorite output" : "Saved output"}
              </p>
              <p className="mt-1 text-xs text-parchment/45">{formatDateTime(output.created_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-icon"
                onClick={() => onCopy(output)}
                title="Copy output"
                type="button"
              >
                <Copy aria-hidden="true" size={16} />
              </button>
              <button
                className={`btn-icon ${output.is_favorite ? "text-brass" : ""}`}
                onClick={() => onFavorite(output)}
                title={output.is_favorite ? "Remove favorite" : "Favorite output"}
                type="button"
              >
                <Heart aria-hidden="true" fill={output.is_favorite ? "currentColor" : "none"} size={16} />
              </button>
              <button
                className="btn-icon"
                onClick={() => onDelete(output)}
                title="Delete output"
                type="button"
              >
                <Trash2 aria-hidden="true" size={16} />
              </button>
            </div>
          </div>
          {copiedId === output.id ? (
            <p className="mb-4 rounded-md border border-jade/40 bg-jade/10 px-3 py-2 text-xs text-[#b8e7d4]">
              Copied to clipboard.
            </p>
          ) : null}
          <RenderValue value={output.content} />
        </article>
      ))}
    </div>
  );
}

function RenderValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <p className="text-sm text-parchment/46">Empty</p>;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return <p className="whitespace-pre-wrap text-sm leading-7 text-parchment/78">{String(value)}</p>;
  }

  if (Array.isArray(value)) {
    return (
      <div className="space-y-3">
        {value.map((item, index) => (
          <div className="rounded-md border border-brass/12 bg-ink/35 p-3" key={index}>
            <RenderValue value={item} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <div className="space-y-5">
        {Object.entries(value as Record<string, unknown>).map(([key, child]) => (
          <section key={key}>
            <h3 className="mb-2 font-display text-xl text-parchment">{titleize(key)}</h3>
            <RenderValue value={child} />
          </section>
        ))}
      </div>
    );
  }

  return null;
}

function briefToForm(brief: CreativeBrief | null): BriefFormState {
  return {
    big_idea: brief?.big_idea || "",
    tension: brief?.tension || "",
    emotional_trigger: brief?.emotional_trigger || "",
    buyer_objection: brief?.buyer_objection || "",
    hidden_desire: brief?.hidden_desire || "",
    campaign_angle: brief?.campaign_angle || "",
    desired_action: brief?.desired_action || "",
    avoid_list: brief?.avoid_list || ""
  };
}

function titleize(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function outputToPlainText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(outputToPlainText).filter(Boolean).join("\n\n");
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, child]) => `${titleize(key)}\n${outputToPlainText(child)}`)
      .filter(Boolean)
      .join("\n\n");
  }

  return "";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
