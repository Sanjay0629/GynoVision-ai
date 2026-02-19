import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import { ScrollToTop } from "./components/ScrollToTop";
import Index from "./pages/Index";
import UterineClinical from "./pages/UterineClinical";
import UterineMolecular from "./pages/UterineMolecular";
import CervicalClinical from "./pages/CervicalClinical";
import CervicalCytology from "./pages/CervicalCytology";
import About from "./pages/About";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/uterine-clinical" element={<UterineClinical />} />
            <Route path="/uterine-molecular" element={<UterineMolecular />} />
            <Route path="/cervical-clinical" element={<CervicalClinical />} />
            <Route path="/cervical-cytology" element={<CervicalCytology />} />
            <Route path="/about" element={<About />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
