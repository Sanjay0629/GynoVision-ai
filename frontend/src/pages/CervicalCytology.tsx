import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import { Microscope, Upload, Activity, Shield, TrendingUp, Eye } from "lucide-react";

interface ClassificationResult {
  prediction: string;
  confidence: number;
  classes: string[];
  class_probabilities: Record<string, number>;
  gradcam?: string; // base64 PNG
}

const CELL_TYPE_INFO: Record<string, { color: string; description: string }> = {
  Dyskeratotic:              { color: "bg-red-500",    description: "Abnormal keratinization — may indicate dysplasia or malignancy" },
  Koilocytotic:              { color: "bg-orange-500", description: "HPV-associated cytopathic changes — warrants follow-up" },
  Metaplastic:               { color: "bg-yellow-500", description: "Squamous metaplasia — usually benign transformation" },
  Parabasal:                 { color: "bg-blue-500",   description: "Parabasal cells — seen in atrophy or regeneration" },
  "Superficial-Intermediate":{ color: "bg-green-500",  description: "Normal mature squamous cells" },
};

const CervicalCytology = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ClassificationResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
      fileRef.current!.files = e.target.files;
      setResults(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!preview || !file) return;

    setLoading(true);
    setResults(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5009/predict/cervical", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to classify image.");
      }

      const data: ClassificationResult = await response.json();
      setResults(data);
    } catch (error: any) {
      console.error("Classification error:", error);
      alert(error.message || "An error occurred during classification.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Results panel ────────────────────────────────────────────────── */
  const ResultsPanel = () => {
    if (loading) {
      return (
        <div className="medical-card flex flex-col items-center justify-center min-h-[280px]">
          <Activity className="h-8 w-8 text-primary animate-pulse-soft" />
          <p className="mt-3 text-sm text-muted-foreground">Classifying image…</p>
        </div>
      );
    }

    if (!results) {
      return (
        <div className="medical-card flex flex-col items-center justify-center min-h-[280px] text-center">
          <Shield className="h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-3 font-display text-lg font-semibold text-foreground">Classification Results</h3>
          <p className="mt-1 text-sm text-muted-foreground">Upload and classify an image to see results</p>
        </div>
      );
    }

    const info = CELL_TYPE_INFO[results.prediction];
    const sortedProbs = Object.entries(results.class_probabilities).sort(
      ([, a], [, b]) => b - a
    );

    return (
      <div className="space-y-6">
        {/* Prediction card */}
        <div className="medical-card space-y-4">
          <h3 className="font-display text-lg font-semibold text-foreground">Classification Results</h3>

          {/* Predicted class */}
          <div className="p-4 rounded-lg bg-secondary">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Predicted Cell Type</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${info?.color ?? "bg-gray-500"}`}>
                {results.prediction}
              </span>
            </div>
            {info && (
              <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
            )}
          </div>

          {/* Confidence */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" /> Model Confidence
            </span>
            <span className="text-sm font-semibold text-foreground">
              {(results.confidence * 100).toFixed(1)}%
            </span>
          </div>

          {/* Class probability bars */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Class Probabilities</h4>
            {sortedProbs.map(([cls, prob]) => {
              const barColor = CELL_TYPE_INFO[cls]?.color ?? "bg-gray-400";
              const isPredicted = cls === results.prediction;
              return (
                <div key={cls} className={`space-y-1 ${isPredicted ? "opacity-100" : "opacity-70"}`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`${isPredicted ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {cls}
                    </span>
                    <span className={`${isPredicted ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {(prob * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all duration-700`}
                      style={{ width: `${prob * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interpretation */}
          <div className="p-3 rounded-lg border border-border bg-card text-sm text-muted-foreground">
            Predicted cell class: <strong className="text-foreground">{results.prediction}</strong>.
            Confidence: <strong className="text-foreground">{(results.confidence * 100).toFixed(1)}%</strong>.
            Clinical correlation is recommended.
          </div>
        </div>

        {/* Grad-CAM heatmap */}
        {results.gradcam && (
          <div className="medical-card space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-semibold text-foreground">Grad-CAM Visualization</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Highlights the image regions that most influenced the model's classification. Warmer colors (red/yellow) indicate higher activation.
            </p>
            <div className="rounded-lg overflow-hidden border border-border">
              <img
                src={`data:image/png;base64,${results.gradcam}`}
                alt="Grad-CAM heatmap overlay"
                className="w-full h-auto"
              />
            </div>
            <p className="text-[11px] text-muted-foreground/70 italic">
              Gradient-weighted Class Activation Mapping (Grad-CAM) — Selvaraju et al., 2017
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container py-10 space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-medical-teal-light flex items-center justify-center">
            <Microscope className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Cervical Cytology – Image Classification</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          CNN-based Pap smear cell classification for cervical cancer screening. Upload a cytology image to receive an AI-powered cell type prediction with Grad-CAM visual explanation.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="medical-card space-y-5 self-start">
          <h2 className="font-display font-semibold text-foreground">Image Upload</h2>

          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors min-h-[200px]"
          >
            {preview ? (
              <img src={preview} alt="Cytology preview" className="max-h-[200px] rounded-lg object-contain" />
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground text-center">
                  Click to upload Pap smear image
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">Accepts .jpg, .png, .bmp</p>
              </>
            )}
          </div>
          <label htmlFor="cytology-file-input" className="sr-only">
            Upload cytology image
          </label>
          <input
            id="cytology-file-input"
            ref={fileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.bmp"
            onChange={handleFile}
            title="Upload a Pap smear image for classification"
            className="hidden"
          />

          <Button type="submit" disabled={loading || !preview} className="w-full">
            {loading ? "Classifying…" : "Classify Image"}
          </Button>
        </form>

        <ResultsPanel />
      </div>

      <DisclaimerBanner text="This is a screening support tool, not a diagnostic system. Results must be validated by a qualified cytopathologist." />
    </div>
  );
};

export default CervicalCytology;
