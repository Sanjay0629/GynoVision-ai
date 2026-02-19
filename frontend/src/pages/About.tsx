import { Brain, Database, Microscope, Shield, Activity, Cpu } from "lucide-react";

const About = () => {
  return (
    <div className="container py-10 space-y-12 max-w-4xl">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-3">About GynoVision AI</h1>
        <p className="text-muted-foreground leading-relaxed">
          GynoVision AI is an academic, multimodal artificial intelligence system designed to assist clinicians and researchers in gynecological cancer screening, risk prediction, and prognosis analysis. The platform integrates clinical, molecular, and imaging data to provide comprehensive decision support.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {[
          { icon: Brain, title: "Multimodal AI Approach", desc: "Combines structured clinical data, TCGA molecular profiles, and cytology image analysis to provide holistic cancer risk assessment across multiple modalities." },
          { icon: Database, title: "Academic Datasets", desc: "Leverages established academic datasets including TCGA (The Cancer Genome Atlas) for molecular analysis and SipakMed for cytology image classification." },
          { icon: Microscope, title: "Deep Learning Imaging", desc: "Utilizes convolutional neural networks (CNNs) for automated Pap smear cell classification, supporting cervical cancer screening workflows." },
          { icon: Shield, title: "Decision Support Focus", desc: "Designed as a clinical decision support tool — not a diagnostic system. All outputs emphasize evidence-based risk stratification to complement clinical judgment." },
          { icon: Cpu, title: "Technology Stack", desc: "Built with React and modern web technologies on the frontend, with Flask/FastAPI serving machine learning models on the backend." },
          { icon: Activity, title: "Research Purpose", desc: "Developed as an academic research project demonstrating the feasibility of multimodal AI in gynecological oncology screening and prognosis." },
        ].map((item) => (
          <div key={item.title} className="medical-card space-y-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-foreground">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default About;
