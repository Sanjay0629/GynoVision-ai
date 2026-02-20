import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import {
  Stethoscope,
  Activity,
  Shield,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ShapFeature {
  feature: string;
  shap_value: number;
  direction: string;
}

interface PredictionResponse {
  prediction: number;
  probability: number;
  risk_tier: string;
  risk_color: string;
  threshold_used: { low_upper: number; high_lower: number };
  shap_explanation: ShapFeature[];
  clinical_recommendations: string[];
  disclaimer: string;
}

/* ------------------------------------------------------------------ */
/*  Default form state                                                 */
/* ------------------------------------------------------------------ */

const initialFormData = {
  Age: "",
  BMI: "",
  MenopauseStatus: "",
  AbnormalBleeding: false,
  PelvicPain: false,
  VaginalDischarge: false,
  UnexplainedWeightLoss: false,
  ThickEndometrium: "",
  CA125_Level: "",
  Hypertension: false,
  Diabetes: false,
  FamilyHistoryCancer: false,
  Smoking: false,
  EstrogenTherapy: false,
  HistologyType: "",
  Parity: "",
  Gravidity: "",
  HormoneReceptorStatus: "",
};

/* ------------------------------------------------------------------ */
/*  Shared input class                                                 */
/* ------------------------------------------------------------------ */

const inputClass =
  "w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

/* ------------------------------------------------------------------ */
/*  Sub-components: section header, field helpers                      */
/* ------------------------------------------------------------------ */

const SectionHeader = ({
  title,
  count,
}: {
  title: string;
  count: number;
}) => (
  <div className="flex items-center gap-2 pt-2">
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    <span className="text-xs text-muted-foreground">({count} fields)</span>
  </div>
);

const ToggleRow = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between rounded-md border border-input px-3 py-2.5">
    <Label className="text-sm font-medium text-foreground cursor-pointer">
      {label}
    </Label>
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">
        {checked ? "Yes" : "No"}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Results panel                                                      */
/* ------------------------------------------------------------------ */

const ResultsPanel = ({
  results,
  loading,
}: {
  results: PredictionResponse | null;
  loading: boolean;
}) => {
  if (loading) {
    return (
      <div className="medical-card flex flex-col items-center justify-center min-h-[400px]">
        <Activity className="h-8 w-8 text-primary animate-pulse" />
        <p className="mt-3 text-sm text-muted-foreground">
          Analyzing clinical data…
        </p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="medical-card flex flex-col items-center justify-center min-h-[400px] text-center">
        <Shield className="h-10 w-10 text-muted-foreground/40" />
        <h3 className="mt-3 font-display text-lg font-semibold text-foreground">
          Prediction Results
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit the form to see risk assessment
        </p>
      </div>
    );
  }

  const pct = (results.probability * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Risk Tier + Probability */}
      <div className="medical-card space-y-4">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Risk Assessment
        </h3>

        {/* Risk tier badge */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
          <span className="text-sm text-muted-foreground">Risk Tier</span>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: results.risk_color }}
          >
            {results.risk_tier}
          </span>
        </div>

        {/* Probability bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Probability Score
            </span>
            <span className="text-sm font-semibold text-foreground">
              {pct}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                backgroundColor: results.risk_color,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0%</span>
            <span className="border-l border-muted-foreground/30 px-1">
              Low ≤ {(results.threshold_used.low_upper * 100).toFixed(0)}%
            </span>
            <span className="border-l border-muted-foreground/30 px-1">
              High ≥ {(results.threshold_used.high_lower * 100).toFixed(0)}%
            </span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* SHAP Explanation */}
      {results.shap_explanation?.length > 0 && (
        <div className="medical-card space-y-4">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Key Contributing Factors
          </h3>
          <p className="text-xs text-muted-foreground">
            Top features influencing this prediction (SHAP values)
          </p>
          <div className="space-y-3">
            {results.shap_explanation.map((f, i) => {
              const maxAbs = Math.max(
                ...results.shap_explanation.map((s) => Math.abs(s.shap_value))
              );
              const widthPct = Math.min(
                (Math.abs(f.shap_value) / maxAbs) * 100,
                100
              );
              const isRisk = f.direction === "increases risk";
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">
                      {f.feature.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`font-semibold ${isRisk ? "text-red-500" : "text-emerald-500"
                        }`}
                    >
                      {isRisk ? "↑" : "↓"} {Math.abs(f.shap_value).toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isRisk ? "bg-red-500/80" : "bg-emerald-500/80"
                        }`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clinical Recommendations */}
      {results.clinical_recommendations?.length > 0 && (
        <div className="medical-card space-y-3">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Clinical Recommendations
          </h3>
          <ul className="space-y-2">
            {results.clinical_recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/85">
                <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer from response */}
      {results.disclaimer && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-medical-warning-light border border-medical-warning/20">
          <AlertCircle className="h-5 w-5 text-medical-warning shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80">{results.disclaimer}</p>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

const API_URL = "http://localhost:5007/predict/uterine";

const UterineClinical = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* helpers */
  const setField = (key: keyof typeof initialFormData, value: string | boolean) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const buildPayload = () => ({
    Age: Number(formData.Age),
    BMI: Number(formData.BMI),
    MenopauseStatus: formData.MenopauseStatus,
    AbnormalBleeding: formData.AbnormalBleeding ? "Yes" : "No",
    PelvicPain: formData.PelvicPain ? "Yes" : "No",
    VaginalDischarge: formData.VaginalDischarge ? "Yes" : "No",
    UnexplainedWeightLoss: formData.UnexplainedWeightLoss ? "Yes" : "No",
    ThickEndometrium: Number(formData.ThickEndometrium),
    CA125_Level: Number(formData.CA125_Level),
    Hypertension: formData.Hypertension ? "Yes" : "No",
    Diabetes: formData.Diabetes ? "Yes" : "No",
    FamilyHistoryCancer: formData.FamilyHistoryCancer ? "Yes" : "No",
    Smoking: formData.Smoking ? "Yes" : "No",
    EstrogenTherapy: formData.EstrogenTherapy ? "Yes" : "No",
    HistologyType: formData.HistologyType,
    Parity: Number(formData.Parity),
    Gravidity: Number(formData.Gravidity),
    HormoneReceptorStatus: formData.HormoneReceptorStatus,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Server returned ${res.status}`);
      }

      const data: PredictionResponse = await res.json();
      setResults(data);
    } catch (err: any) {
      const msg = err.message || "Failed to reach the prediction server.";
      setError(msg);
      toast.error("Prediction failed", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setResults(null);
    setError(null);
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="container py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Uterine Cancer – Clinical Prediction
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Enter 18 clinical parameters to receive an AI-powered risk
          assessment with SHAP explanations and clinical recommendations.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* -------- Input Form -------- */}
        <form onSubmit={handleSubmit} className="medical-card space-y-5">
          <h2 className="font-display font-semibold text-foreground">
            Patient Clinical Data
          </h2>

          {/* === Demographics === */}
          <SectionHeader title="Demographics" count={3} />
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="age">Age (years)</Label>
              <input
                id="age"
                type="number"
                min={18}
                max={100}
                step={1}
                required
                placeholder="e.g. 62"
                value={formData.Age}
                onChange={(e) => setField("Age", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bmi">BMI (kg/m²)</Label>
              <input
                id="bmi"
                type="number"
                min={10}
                max={60}
                step={0.1}
                required
                placeholder="e.g. 31.5"
                value={formData.BMI}
                onChange={(e) => setField("BMI", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Menopause Status</Label>
            <Select
              value={formData.MenopauseStatus}
              onValueChange={(v) => setField("MenopauseStatus", v)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Premenopausal">Premenopausal</SelectItem>
                <SelectItem value="Perimenopausal">Perimenopausal</SelectItem>
                <SelectItem value="Postmenopausal">Postmenopausal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* === Symptoms === */}
          <SectionHeader title="Symptoms" count={4} />
          <div className="space-y-3">
            <ToggleRow
              label="Abnormal Uterine Bleeding"
              checked={formData.AbnormalBleeding}
              onChange={(v) => setField("AbnormalBleeding", v)}
            />
            <ToggleRow
              label="Chronic Pelvic Pain"
              checked={formData.PelvicPain}
              onChange={(v) => setField("PelvicPain", v)}
            />
            <ToggleRow
              label="Abnormal Vaginal Discharge"
              checked={formData.VaginalDischarge}
              onChange={(v) => setField("VaginalDischarge", v)}
            />
            <ToggleRow
              label="Unexplained Weight Loss"
              checked={formData.UnexplainedWeightLoss}
              onChange={(v) => setField("UnexplainedWeightLoss", v)}
            />
          </div>

          {/* === Clinical Measurements === */}
          <SectionHeader title="Clinical Measurements" count={2} />
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="endometrium">Endometrial Thickness (mm)</Label>
              <input
                id="endometrium"
                type="number"
                min={1}
                max={50}
                step={0.1}
                required
                placeholder="e.g. 18.5"
                value={formData.ThickEndometrium}
                onChange={(e) => setField("ThickEndometrium", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ca125">CA-125 Level (U/mL)</Label>
              <input
                id="ca125"
                type="number"
                min={0}
                max={500}
                step={0.1}
                required
                placeholder="e.g. 65.3"
                value={formData.CA125_Level}
                onChange={(e) => setField("CA125_Level", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* === Medical History === */}
          <SectionHeader title="Medical History" count={5} />
          <div className="space-y-3">
            <ToggleRow
              label="History of Hypertension"
              checked={formData.Hypertension}
              onChange={(v) => setField("Hypertension", v)}
            />
            <ToggleRow
              label="History of Diabetes"
              checked={formData.Diabetes}
              onChange={(v) => setField("Diabetes", v)}
            />
            <ToggleRow
              label="Family History of Cancer"
              checked={formData.FamilyHistoryCancer}
              onChange={(v) => setField("FamilyHistoryCancer", v)}
            />
            <ToggleRow
              label="Current/Former Smoker"
              checked={formData.Smoking}
              onChange={(v) => setField("Smoking", v)}
            />
            <ToggleRow
              label="Estrogen Therapy (HRT)"
              checked={formData.EstrogenTherapy}
              onChange={(v) => setField("EstrogenTherapy", v)}
            />
          </div>

          {/* === Pathology / Reproductive === */}
          <SectionHeader title="Pathology / Reproductive" count={4} />
          <div className="space-y-1.5">
            <Label>Histology Type</Label>
            <Select
              value={formData.HistologyType}
              onValueChange={(v) => setField("HistologyType", v)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Endometrioid">Endometrioid</SelectItem>
                <SelectItem value="Serous">Serous</SelectItem>
                <SelectItem value="Clear Cell">Clear Cell</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="parity">Parity (live births)</Label>
              <input
                id="parity"
                type="number"
                min={0}
                max={15}
                step={1}
                required
                placeholder="e.g. 2"
                value={formData.Parity}
                onChange={(e) => setField("Parity", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gravidity">Gravidity (pregnancies)</Label>
              <input
                id="gravidity"
                type="number"
                min={0}
                max={20}
                step={1}
                required
                placeholder="e.g. 3"
                value={formData.Gravidity}
                onChange={(e) => setField("Gravidity", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Hormone Receptor Status</Label>
            <Select
              value={formData.HormoneReceptorStatus}
              onValueChange={(v) => setField("HormoneReceptorStatus", v)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Positive">Positive</SelectItem>
                <SelectItem value="Negative">Negative</SelectItem>
                <SelectItem value="Unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* === Actions === */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Predicting…" : "Predict Risk"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </Button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* -------- Results -------- */}
        <div className="lg:sticky lg:top-24">
          <ResultsPanel results={results} loading={loading} />
        </div>
      </div>

      <DisclaimerBanner />
    </div>
  );
};

export default UterineClinical;
