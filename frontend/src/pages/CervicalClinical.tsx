import { useState } from "react";
import { Button } from "@/components/ui/button";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import { Activity, AlertTriangle, CheckCircle, FileHeart, Shield } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface ShapEntry {
  feature: string;
  shap_value: number;
  direction: "increases risk" | "decreases risk";
}

interface PredictionResult {
  cancer_probability: number;
  risk_label: "Low Risk" | "Moderate Risk" | "High Risk";
  thresholds: { T1: number; T2: number };
  shap_explanation: ShapEntry[];
  cds_guidance: { summary: string; actions: string[] };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const INPUT_CLS =
  "w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

const SELECT_CLS =
  "w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

const riskBadgeClass = (label: string) => {
  if (label === "High Risk") return "medical-badge medical-badge-warning";
  if (label === "Moderate Risk") return "medical-badge medical-badge-teal";
  return "medical-badge medical-badge-green";
};

const RiskIcon = ({ label }: { label: string }) => {
  if (label === "High Risk") return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  if (label === "Moderate Risk") return <Activity className="h-5 w-5 text-teal-500" />;
  return <CheckCircle className="h-5 w-5 text-medical-green" />;
};

// ── Field helpers ─────────────────────────────────────────────────────────────

const NumInput = ({
  label, field, placeholder, optional, value, onChange,
}: {
  label: string; field: string; placeholder?: string; optional?: boolean;
  value: string; onChange: (f: string, v: string) => void;
}) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-foreground">
      {label}{optional && <span className="text-muted-foreground text-xs"> (optional)</span>}
    </label>
    <input
      type="number"
      min={0}
      placeholder={placeholder ?? "0"}
      value={value}
      onChange={(e) => onChange(field, e.target.value)}
      className={INPUT_CLS}
    />
  </div>
);

const YesNoSelect = ({
  label, field, value, onChange,
}: {
  label: string; field: string; value: string; onChange: (f: string, v: string) => void;
}) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    <select value={value} onChange={(e) => onChange(field, e.target.value)} className={SELECT_CLS} title={label}>
      <option value="">Select…</option>
      <option value="1">Yes</option>
      <option value="0">No</option>
    </select>
  </div>
);

// ── Initial empty form state ──────────────────────────────────────────────────

const INITIAL_FORM: Record<string, string> = {
  "Age": "", "Number of sexual partners": "", "First sexual intercourse": "",
  "Num of pregnancies": "", "Smokes": "", "Smokes (years)": "", "Smokes (packs/year)": "",
  "Hormonal Contraceptives": "", "Hormonal Contraceptives (years)": "",
  "IUD": "", "IUD (years)": "",
  "STDs": "", "STDs (number)": "", "STDs:condylomatosis": "",
  "STDs:cervical condylomatosis": "", "STDs:vaginal condylomatosis": "",
  "STDs:vulvo-perineal condylomatosis": "", "STDs:syphilis": "",
  "STDs:pelvic inflammatory disease": "", "STDs:genital herpes": "",
  "STDs:molluscum contagiosum": "", "STDs:AIDS": "", "STDs:HIV": "",
  "STDs:Hepatitis B": "", "STDs:HPV": "", "STDs: Number of diagnosis": "",
  "STDs: Time since first diagnosis": "", "STDs: Time since last diagnosis": "",
};

// ── Main Component ────────────────────────────────────────────────────────────

const CervicalClinical = () => {
  const [form, setForm] = useState<Record<string, string>>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PredictionResult | null>(null);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Convert form strings → numbers (null for empty optional fields)
    const payload: Record<string, number | null> = {};
    for (const [key, val] of Object.entries(form)) {
      payload[key] = val === "" ? null : parseFloat(val);
    }

    try {
      const res = await fetch("http://localhost:5010/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Server error");
      setResults(json as PredictionResult);
    } catch (err: any) {
      setError(err.message ?? "Failed to reach the prediction server.");
    } finally {
      setLoading(false);
    }
  };

  const maxShapAbs = results
    ? Math.max(...results.shap_explanation.map((s) => Math.abs(s.shap_value)), 0.001)
    : 1;

  return (
    <div className="container py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-medical-green-light flex items-center justify-center">
            <FileHeart className="h-5 w-5 text-medical-green" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Cervical Cancer – Clinical Prediction
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Clinical risk stratification for cervical cancer using structured patient data and machine
          learning models.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="medical-card space-y-6">
          <div>
            <h2 className="font-display font-semibold text-foreground">Patient Clinical Data</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Enter clinical parameters for cervical cancer risk assessment.
            </p>
          </div>

          {/* Section A */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              A — Demographics &amp; Lifestyle
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <NumInput label="Age" field="Age" placeholder="e.g. 35" value={form["Age"]} onChange={handleChange} />
              <NumInput label="Number of sexual partners" field="Number of sexual partners" optional value={form["Number of sexual partners"]} onChange={handleChange} />
              <NumInput label="Age at first intercourse" field="First sexual intercourse" placeholder="e.g. 18" optional value={form["First sexual intercourse"]} onChange={handleChange} />
              <NumInput label="Number of pregnancies" field="Num of pregnancies" value={form["Num of pregnancies"]} onChange={handleChange} />
              <YesNoSelect label="Smokes?" field="Smokes" value={form["Smokes"]} onChange={handleChange} />
              <NumInput label="Smoking duration (years)" field="Smokes (years)" optional value={form["Smokes (years)"]} onChange={handleChange} />
              <NumInput label="Smoking amount (packs/year)" field="Smokes (packs/year)" value={form["Smokes (packs/year)"]} onChange={handleChange} />
            </div>
          </div>

          {/* Section B */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              B — Contraception &amp; IUD
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <YesNoSelect label="Uses hormonal contraceptives?" field="Hormonal Contraceptives" value={form["Hormonal Contraceptives"]} onChange={handleChange} />
              <NumInput label="HC duration (years)" field="Hormonal Contraceptives (years)" optional value={form["Hormonal Contraceptives (years)"]} onChange={handleChange} />
              <YesNoSelect label="IUD use?" field="IUD" value={form["IUD"]} onChange={handleChange} />
              <NumInput label="IUD duration (years)" field="IUD (years)" value={form["IUD (years)"]} onChange={handleChange} />
            </div>
          </div>

          {/* Section C */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              C — STD History
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <YesNoSelect label="Any STD history?" field="STDs" value={form["STDs"]} onChange={handleChange} />
              <NumInput label="Number of STDs" field="STDs (number)" value={form["STDs (number)"]} onChange={handleChange} />
              <YesNoSelect label="Condylomatosis" field="STDs:condylomatosis" value={form["STDs:condylomatosis"]} onChange={handleChange} />
              <YesNoSelect label="Cervical condylomatosis" field="STDs:cervical condylomatosis" value={form["STDs:cervical condylomatosis"]} onChange={handleChange} />
              <YesNoSelect label="Vaginal condylomatosis" field="STDs:vaginal condylomatosis" value={form["STDs:vaginal condylomatosis"]} onChange={handleChange} />
              <YesNoSelect label="Vulvo-perineal condylomatosis" field="STDs:vulvo-perineal condylomatosis" value={form["STDs:vulvo-perineal condylomatosis"]} onChange={handleChange} />
              <YesNoSelect label="Syphilis" field="STDs:syphilis" value={form["STDs:syphilis"]} onChange={handleChange} />
              <YesNoSelect label="Pelvic inflammatory disease" field="STDs:pelvic inflammatory disease" value={form["STDs:pelvic inflammatory disease"]} onChange={handleChange} />
              <YesNoSelect label="Genital herpes" field="STDs:genital herpes" value={form["STDs:genital herpes"]} onChange={handleChange} />
              <YesNoSelect label="Molluscum contagiosum" field="STDs:molluscum contagiosum" value={form["STDs:molluscum contagiosum"]} onChange={handleChange} />
              <YesNoSelect label="AIDS" field="STDs:AIDS" value={form["STDs:AIDS"]} onChange={handleChange} />
              <YesNoSelect label="HIV" field="STDs:HIV" value={form["STDs:HIV"]} onChange={handleChange} />
              <YesNoSelect label="Hepatitis B" field="STDs:Hepatitis B" value={form["STDs:Hepatitis B"]} onChange={handleChange} />
              <YesNoSelect label="HPV" field="STDs:HPV" value={form["STDs:HPV"]} onChange={handleChange} />
              <NumInput label="Number of STD diagnoses" field="STDs: Number of diagnosis" value={form["STDs: Number of diagnosis"]} onChange={handleChange} />
              <NumInput label="Time since first STD Dx (yrs)" field="STDs: Time since first diagnosis" optional value={form["STDs: Time since first diagnosis"]} onChange={handleChange} />
              <NumInput label="Time since last STD Dx (yrs)" field="STDs: Time since last diagnosis" optional value={form["STDs: Time since last diagnosis"]} onChange={handleChange} />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Predicting…" : "Predict Cervical Cancer Risk"}
          </Button>
        </form>

        {/* ── Results Panel ── */}
        <div className="space-y-4">
          {loading && (
            <div className="medical-card flex flex-col items-center justify-center min-h-[280px]">
              <Activity className="h-8 w-8 text-primary animate-pulse-soft" />
              <p className="mt-3 text-sm text-muted-foreground">Analyzing data…</p>
            </div>
          )}

          {!loading && !results && (
            <div className="medical-card flex flex-col items-center justify-center min-h-[280px] text-center">
              <Shield className="h-10 w-10 text-muted-foreground/40" />
              <h3 className="mt-3 font-display text-lg font-semibold text-foreground">
                Prediction Results
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Submit the form to see prediction results
              </p>
            </div>
          )}

          {!loading && results && (
            <>
              {/* Risk + Probability card */}
              <div className="medical-card space-y-4">
                <div className="flex items-center gap-2">
                  <RiskIcon label={results.risk_label} />
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    Prediction Results
                  </h3>
                </div>

                {/* Risk badge */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <span className="text-sm text-muted-foreground">Risk Level</span>
                  <span className={riskBadgeClass(results.risk_label)}>{results.risk_label}</span>
                </div>

                {/* Probability bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estimated Cancer Probability</span>
                    <span className="text-sm font-semibold text-foreground">
                      {(results.cancer_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        results.risk_label === "High Risk"
                          ? "bg-amber-500"
                          : results.risk_label === "Moderate Risk"
                          ? "bg-teal-500"
                          : "bg-medical-green"
                      }`}
                      style={{ width: `${Math.min(results.cancer_probability * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Thresholds — Moderate: ≥{(results.thresholds.T1 * 100).toFixed(1)}% &nbsp;|&nbsp;
                    High: ≥{(results.thresholds.T2 * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* SHAP Explanation */}
              <div className="medical-card space-y-3">
                <h4 className="font-display font-semibold text-foreground text-sm">
                  Top Factors Driving This Result
                </h4>
                <ul className="space-y-2">
                  {results.shap_explanation.map((entry, i) => (
                    <li key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground font-medium truncate max-w-[60%]">
                          {entry.feature}
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            entry.direction === "increases risk"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-medical-green"
                          }`}
                        >
                          {entry.direction === "increases risk" ? "▲" : "▼"} {entry.direction}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            entry.direction === "increases risk" ? "bg-amber-500" : "bg-medical-green"
                          }`}
                          style={{
                            width: `${(Math.abs(entry.shap_value) / maxShapAbs) * 100}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CDS Guidance */}
              <div className="medical-card space-y-3">
                <h4 className="font-display font-semibold text-foreground text-sm">
                  Clinical Decision Support
                </h4>
                <p className="text-sm text-muted-foreground bg-secondary/60 px-3 py-2 rounded-md italic">
                  {results.cds_guidance.summary}
                </p>
                <ul className="space-y-2">
                  {results.cds_guidance.actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      <DisclaimerBanner />
    </div>
  );
};

export default CervicalClinical;
