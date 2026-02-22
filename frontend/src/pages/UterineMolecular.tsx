import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Dna, Activity, HeartPulse } from "lucide-react";
import { toast } from "sonner";
import DisclaimerBanner from "@/components/DisclaimerBanner";

// Types
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ShapValue {
  feature: string;
  shap_value: number;
  direction: "increases risk" | "decreases risk";
}

interface PredictionResponse {
  subtype: {
    prediction: string;
    confidence: number;
    probabilities: Record<string, number>;
  };
  survival: {
    prediction: string;
    probability_deceased: number;
    risk_tier: string;
  };
  shap_explanation: ShapValue[];
  disclaimer: string;
}

const formatSubtype = (subtype: string) => {
  return subtype.replace("UCEC_", "").replace("_", " ");
};

const RISK_COLORS: Record<string, string> = {
  Low: "#27ae60",
  Intermediate: "#f39c12",
  High: "#e74c3c",
};

const UterineMolecular = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    mutation_count: "",
    fraction_genome_altered: "",
    msi_mantis_score: "",
    msisensor_score: "",
    diagnosis_age: "",
    race_category: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    // Validate race
    if (!formData.race_category) {
      toast.error("Please select a Race/Ethnicity");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5008/predict/uterine-tcga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mutation_count: Number(formData.mutation_count),
          fraction_genome_altered: Number(formData.fraction_genome_altered),
          msi_mantis_score: Number(formData.msi_mantis_score),
          msisensor_score: Number(formData.msisensor_score),
          diagnosis_age: Number(formData.diagnosis_age),
          race_category: formData.race_category,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch prediction");
      }

      const data: PredictionResponse = await response.json();
      setResults(data);
      toast.success("Prediction generated successfully!");
    } catch (err: any) {
      console.error("Prediction error:", err);
      setError(err.message);
      toast.error("An error occurred during prediction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-medical-blue-light flex items-center justify-center">
            <Dna className="h-5 w-5 text-medical-blue" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Uterine Cancer – Molecular TCGA
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          TCGA-based molecular subtype prediction and survival risk analysis. This module classifies endometrial tumors into four molecular subtypes based on genomic markers and predicts survival probability.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="medical-card space-y-5">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="font-display font-semibold text-foreground">
                Genomic Features
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="mutation_count">Mutation Count</Label>
                <Input
                  id="mutation_count"
                  name="mutation_count"
                  type="number"
                  min={0}
                  step={1}
                  required
                  placeholder="e.g. 65"
                  value={formData.mutation_count}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fraction_genome_altered">Fraction Genome Altered</Label>
                <Input
                  id="fraction_genome_altered"
                  name="fraction_genome_altered"
                  type="number"
                  min={0}
                  max={1}
                  step={0.0001}
                  required
                  placeholder="e.g. 0.3311"
                  value={formData.fraction_genome_altered}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="msi_mantis_score">MSI MANTIS Score</Label>
                <Input
                  id="msi_mantis_score"
                  name="msi_mantis_score"
                  type="number"
                  min={0}
                  max={2}
                  step={0.0001}
                  required
                  placeholder="e.g. 0.3234"
                  value={formData.msi_mantis_score}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="msisensor_score">MSIsensor Score</Label>
                <Input
                  id="msisensor_score"
                  name="msisensor_score"
                  type="number"
                  min={0}
                  max={50}
                  step={0.01}
                  required
                  placeholder="e.g. 0.85"
                  value={formData.msisensor_score}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="medical-card space-y-5">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <HeartPulse className="h-5 w-5 text-primary" />
              <h2 className="font-display font-semibold text-foreground">
                Clinical Features
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="diagnosis_age">Age at Diagnosis</Label>
                <Input
                  id="diagnosis_age"
                  name="diagnosis_age"
                  type="number"
                  min={18}
                  max={100}
                  step={1}
                  required
                  placeholder="e.g. 59"
                  value={formData.diagnosis_age}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="race_category">Race / Ethnicity</Label>
                <Select
                  value={formData.race_category}
                  onValueChange={(val) => handleSelectChange("race_category", val)}
                >
                  <SelectTrigger id="race_category">
                    <SelectValue placeholder="Select race" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="White">White</SelectItem>
                    <SelectItem value="Black or African American">
                      Black or African American
                    </SelectItem>
                    <SelectItem value="Asian">Asian</SelectItem>
                    <SelectItem value="Native Hawaiian or Other Pacific Islander">
                      Native Hawaiian or Other Pacific Islander
                    </SelectItem>
                    <SelectItem value="American Indian or Alaska Native">
                      American Indian or Alaska Native
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full text-base py-6">
            {loading ? "Analyzing Molecular Data..." : "Predict Subtype & Survival"}
          </Button>
        </form>

        <div className="space-y-6">
          {results ? (
            <div className="space-y-6 animate-in zoom-in-95 duration-400">
              <div className="medical-card border-t-4 border-t-primary">
                <h3 className="font-display font-semibold text-lg mb-4">
                  Molecular Subtype Prediction
                </h3>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Predicted Subtype</p>
                    <p className="text-4xl font-bold text-primary">
                      {formatSubtype(results.subtype.prediction)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                    <p className="text-2xl font-semibold">
                      {(results.subtype.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="medical-card border-t-4"
                style={{ borderTopColor: RISK_COLORS[results.survival.risk_tier] || RISK_COLORS["Intermediate"] }}
              >
                <h3 className="font-display font-semibold text-lg mb-4">
                  Survival Risk Assessment
                </h3>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Predicted Outcome</p>
                    <p className="text-2xl font-bold" style={{ color: RISK_COLORS[results.survival.risk_tier] || RISK_COLORS["Intermediate"] }}>
                      {results.survival.prediction}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Deceased Probability</p>
                    <p className="text-2xl font-semibold">
                      {(results.survival.probability_deceased * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {results.shap_explanation && results.shap_explanation.length > 0 && (
                <div className="medical-card">
                  <h3 className="font-display font-semibold text-lg mb-4">
                    Key Predictive Factors
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={results.shap_explanation.map((s) => ({
                          ...s,
                          abs_val: Math.abs(s.shap_value),
                          color: s.direction === "increases risk" ? "#e74c3c" : "#27ae60",
                        }))}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="feature"
                          type="category"
                          axisLine={false}
                          tickLine={false}
                          width={140}
                          tick={{ fontSize: 12, fill: "var(--foreground)" }}
                        />
                        <Tooltip
                          formatter={(value: number, name: string, props: any) => [
                            `${value.toFixed(4)} (${props.payload.direction})`,
                            "Impact",
                          ]}
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            borderColor: "var(--border)",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Bar dataKey="abs_val" radius={[0, 4, 4, 0]} barSize={20}>
                          {results.shap_explanation.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.direction === "increases risk" ? "#e74c3c" : "#27ae60"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col justify-center items-center p-12 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
              <Dna className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Awaiting Molecular Data
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Enter the patient's genomic and clinical features on the left to
                predict their TCGA molecular subtype and survival outcome.
              </p>
            </div>
          )}
        </div>
      </div>

      <DisclaimerBanner text="This is a research prototype evaluating TCGA molecular features. Results are not clinically validated for patient care." />
    </div>
  );
};

export default UterineMolecular;
