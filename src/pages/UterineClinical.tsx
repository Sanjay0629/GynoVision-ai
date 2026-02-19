import { useState } from "react";
import { Button } from "@/components/ui/button";
import PredictionOutput from "@/components/PredictionOutput";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import { Stethoscope } from "lucide-react";

const UterineClinical = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Placeholder: will call backend API
    setTimeout(() => {
      setResults({
        riskLevel: "Moderate",
        probability: 0.64,
        confidence: 0.87,
        interpretation: "Moderate risk detected. Further clinical evaluation is recommended.",
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="container py-10 space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Uterine Cancer – Clinical Prediction</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          This module predicts uterine cancer risk using structured clinical data. Input patient parameters and receive an AI-powered risk assessment.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="medical-card space-y-5">
          <h2 className="font-display font-semibold text-foreground">Patient Clinical Data</h2>
          <p className="text-sm text-muted-foreground">Input fields will be configured based on clinical parameters. Submit to test the prediction pipeline.</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Age</label>
              <input type="number" placeholder="e.g. 55" className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">BMI</label>
              <input type="number" step="0.1" placeholder="e.g. 28.5" className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic">Additional clinical fields will be added as the backend model is finalized.</p>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Predicting…" : "Predict Risk"}
          </Button>
        </form>

        {/* Results */}
        <PredictionOutput title="Prediction Results" results={results} loading={loading} />
      </div>

      <DisclaimerBanner />
    </div>
  );
};

export default UterineClinical;
