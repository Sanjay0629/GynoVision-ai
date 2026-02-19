import { AlertTriangle } from "lucide-react";

const DisclaimerBanner = ({ text }: { text?: string }) => (
  <div className="flex items-start gap-3 p-4 rounded-lg bg-medical-warning-light border border-medical-warning/20">
    <AlertTriangle className="h-5 w-5 text-medical-warning shrink-0 mt-0.5" />
    <p className="text-sm text-foreground/80">
      {text || "This tool provides decision support and does not replace medical diagnosis. Always consult a qualified healthcare professional."}
    </p>
  </div>
);

export default DisclaimerBanner;
