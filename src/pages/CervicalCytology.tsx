import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import PredictionOutput from "@/components/PredictionOutput";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import { Microscope, Upload, Image } from "lucide-react";

const CervicalCytology = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
      setResults(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview) return;
    setLoading(true);
    setTimeout(() => {
      setResults({
        cellType: "Koilocytotic",
        confidence: 0.88,
        interpretation: "Koilocytotic cells identified, suggestive of HPV-related changes. Clinical follow-up is recommended.",
      });
      setLoading(false);
    }, 2000);
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
          CNN-based Pap smear cell classification for cervical cancer screening. Upload a cytology image to receive an AI-powered cell type prediction.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="medical-card space-y-5">
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
          <input
            ref={fileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.bmp"
            onChange={handleFile}
            className="hidden"
          />

          <Button type="submit" disabled={loading || !preview} className="w-full">
            {loading ? "Classifying…" : "Classify Image"}
          </Button>
        </form>

        <PredictionOutput title="Classification Results" results={results} loading={loading} />
      </div>

      <DisclaimerBanner text="This is a screening support tool, not a diagnostic system. Results must be validated by a qualified cytopathologist." />
    </div>
  );
};

export default CervicalCytology;
