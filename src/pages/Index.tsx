import { Link } from "react-router-dom";
import { Activity, Brain, Microscope, FileHeart, Dna, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-medical.jpg";

const features = [
  {
    icon: Brain,
    title: "Multimodal AI",
    description: "Combines clinical, molecular, and imaging data for comprehensive cancer risk assessment.",
    badge: "AI-Powered",
    badgeClass: "medical-badge-teal",
  },
  {
    icon: Dna,
    title: "Molecular Prognosis",
    description: "TCGA-based molecular subtype prediction and survival risk analysis for uterine cancers.",
    badge: "Genomics",
    badgeClass: "medical-badge-blue",
  },
  {
    icon: Microscope,
    title: "Cytology Screening",
    description: "CNN-powered Pap smear cell classification for cervical cancer screening support.",
    badge: "Imaging",
    badgeClass: "medical-badge-green",
  },
  {
    icon: FileHeart,
    title: "Clinical Decision Support",
    description: "Structured risk predictions with confidence scores to assist clinical decision-making.",
    badge: "Decision Support",
    badgeClass: "medical-badge-warning",
  },
];

const modules = [
  {
    title: "Uterine Cancer Prediction",
    description: "Clinical data-driven risk assessment for uterine cancer using machine learning models.",
    path: "/uterine-clinical",
    color: "border-l-primary",
  },
  {
    title: "Molecular Prognosis",
    description: "TCGA molecular subtype classification and survival prognosis for endometrial cancer.",
    path: "/uterine-molecular",
    color: "border-l-medical-blue",
  },
  {
    title: "Cervical Cancer Prediction",
    description: "Clinical risk stratification for cervical cancer using structured patient data.",
    path: "/cervical-clinical",
    color: "border-l-medical-green",
  },
  {
    title: "Cytology Image Analysis",
    description: "Deep learning-based classification of Pap smear cell images for screening support.",
    path: "/cervical-cytology",
    color: "border-l-medical-warning",
  },
];

const Index = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative gradient-hero overflow-hidden">
        <div className="container py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <div className="medical-badge medical-badge-teal">
                <Activity className="h-3.5 w-3.5" /> AI-Powered Clinical Decision Support
              </div>
              <h1 className="text-4xl lg:text-5xl font-display font-bold text-foreground leading-tight">
                GynoVision AI
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                Multimodal Gynecological Cancer Prediction and Clinical Decision Support System — integrating clinical, molecular, and imaging data for comprehensive cancer risk assessment.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to="/uterine-clinical"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  Uterine Cancer <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/cervical-clinical"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
                >
                  Cervical Cancer <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="hidden lg:block animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <img
                src={heroImage}
                alt="Medical AI visualization showing DNA helix and microscope"
                className="rounded-2xl shadow-lg w-full object-cover max-h-[400px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold text-foreground">Platform Capabilities</h2>
          <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
            Advanced AI modules designed for gynecological cancer screening and prognosis.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="medical-card text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <span className={`medical-badge ${f.badgeClass}`}>{f.badge}</span>
              <h3 className="font-display font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section id="prediction-modules" className="container pb-20">
        <h2 className="text-3xl font-display font-bold text-foreground mb-8">Prediction Modules</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {modules.map((m) => (
            <Link
              key={m.path}
              to={m.path}
              className={`medical-card border-l-4 ${m.color} flex items-start justify-between gap-4 group`}
            >
              <div>
                <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                  {m.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
