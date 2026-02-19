import { useState } from "react";
import { Button } from "@/components/ui/button";
import PredictionOutput from "@/components/PredictionOutput";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import { FileHeart } from "lucide-react";

const CervicalClinical = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setResults({
        riskLevel: "Low",
        probability: 0.23,
        confidence: 0.92,
        interpretation: "Low risk classification. Routine screening schedule recommended.",
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="container py-10 space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-medical-green-light flex items-center justify-center">
            <FileHeart className="h-5 w-5 text-medical-green" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Cervical Cancer – Clinical Prediction</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Clinical risk stratification for cervical cancer using structured patient data and machine learning models.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="medical-card space-y-5">
          <h2 className="font-display font-semibold text-foreground">Patient Clinical Data</h2>
          <p className="text-sm text-muted-foreground">Enter clinical parameters for cervical cancer risk assessment.</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Age</label>
              <input type="number" placeholder="e.g. 42" className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">HPV Status</label>
              <select className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select…</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic">Additional clinical fields will be added as the backend model is finalized.</p>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Predicting…" : "Predict Cervical Cancer Risk"}
          </Button>
        </form>

        <PredictionOutput title="Prediction Results" results={results} loading={loading} />
      </div>

      <DisclaimerBanner />
    </div>
  );
};

export default CervicalClinical;
