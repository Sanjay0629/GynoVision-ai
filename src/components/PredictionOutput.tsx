import { Activity, TrendingUp, Shield } from "lucide-react";

interface PredictionOutputProps {
  title: string;
  results?: {
    riskLevel?: string;
    probability?: number;
    confidence?: number;
    subtype?: string;
    survivalRisk?: string;
    cellType?: string;
    interpretation?: string;
  } | null;
  loading?: boolean;
}

const PredictionOutput = ({ title, results, loading }: PredictionOutputProps) => {
  if (loading) {
    return (
      <div className="medical-card flex flex-col items-center justify-center min-h-[280px]">
        <Activity className="h-8 w-8 text-primary animate-pulse-soft" />
        <p className="mt-3 text-sm text-muted-foreground">Analyzing data…</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="medical-card flex flex-col items-center justify-center min-h-[280px] text-center">
        <Shield className="h-10 w-10 text-muted-foreground/40" />
        <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">Submit the form to see prediction results</p>
      </div>
    );
  }

  return (
    <div className="medical-card space-y-4">
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>

      {results.riskLevel && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
          <span className="text-sm text-muted-foreground">Risk Level</span>
          <span className={`medical-badge ${
            results.riskLevel === "High" ? "medical-badge-warning" :
            results.riskLevel === "Low" ? "medical-badge-green" : "medical-badge-teal"
          }`}>
            {results.riskLevel}
          </span>
        </div>
      )}

      {results.probability !== undefined && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Probability Score</span>
            <span className="text-sm font-semibold text-foreground">{(results.probability * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${results.probability * 100}%` }}
            />
          </div>
        </div>
      )}

      {results.confidence !== undefined && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" /> Confidence
          </span>
          <span className="text-sm font-semibold text-foreground">{(results.confidence * 100).toFixed(1)}%</span>
        </div>
      )}

      {results.subtype && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
          <span className="text-sm text-muted-foreground">Molecular Subtype</span>
          <span className="medical-badge medical-badge-blue">{results.subtype}</span>
        </div>
      )}

      {results.survivalRisk && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
          <span className="text-sm text-muted-foreground">Survival Risk</span>
          <span className={`medical-badge ${
            results.survivalRisk === "High" ? "medical-badge-warning" : "medical-badge-green"
          }`}>
            {results.survivalRisk}
          </span>
        </div>
      )}

      {results.cellType && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
          <span className="text-sm text-muted-foreground">Predicted Cell Type</span>
          <span className="medical-badge medical-badge-teal">{results.cellType}</span>
        </div>
      )}

      {results.interpretation && (
        <p className="text-sm text-muted-foreground italic border-l-2 border-primary pl-3">
          {results.interpretation}
        </p>
      )}
    </div>
  );
};

export default PredictionOutput;
