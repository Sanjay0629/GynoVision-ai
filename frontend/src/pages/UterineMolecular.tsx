import { useState } from "react";
import { Button } from "@/components/ui/button";
import PredictionOutput from "@/components/PredictionOutput";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import { Dna } from "lucide-react";

const UterineMolecular = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setResults({
        subtype: "MSI",
        survivalRisk: "Low",
        confidence: 0.91,
        interpretation: "Microsatellite Instability subtype identified. Associated with favorable prognosis and potential immunotherapy responsiveness.",
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="container py-10 space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-medical-blue-light flex items-center justify-center">
            <Dna className="h-5 w-5 text-medical-blue" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Uterine Cancer – Molecular Prognosis</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          TCGA-based molecular subtype prediction and survival risk analysis. This module classifies endometrial tumors into four molecular subtypes: POLE, MSI, CN_LOW, and CN_HIGH.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="medical-card space-y-5">
          <h2 className="font-display font-semibold text-foreground">Molecular Input Data</h2>
          <p className="text-sm text-muted-foreground">Provide genomic and molecular markers for subtype classification. Fields will be extended based on TCGA feature sets.</p>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Gene Expression Profile</label>
            <textarea placeholder="Paste gene expression data or select features…" rows={4} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>

          <p className="text-xs text-muted-foreground italic">Input format and additional molecular markers will be defined with model integration.</p>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Analyzing…" : "Predict Prognosis"}
          </Button>
        </form>

        <PredictionOutput title="Molecular Prognosis Results" results={results} loading={loading} />
      </div>

      <DisclaimerBanner />
    </div>
  );
};

export default UterineMolecular;
