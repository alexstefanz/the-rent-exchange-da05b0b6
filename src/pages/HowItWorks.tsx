import { Shield, Clock, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useUxCopy } from "@/hooks/useUxCopy";

const HowItWorks = () => {
  const copy = useUxCopy();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="border-b border-border bg-secondary/30 py-16 md:py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h1 className="font-heading text-3xl font-semibold text-foreground">{copy.home.howItWorks}</h1>
            <p className="mt-2 text-muted-foreground">{copy.home.howItWorksSubtitle}</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: Sparkles, title: copy.home.step1Title, description: copy.home.step1Desc },
              { icon: Clock, title: copy.home.step2Title, description: copy.home.step2Desc },
              { icon: Shield, title: copy.home.step3Title, description: copy.home.step3Desc },
            ].map((step) => (
              <div key={step.title} className="group rounded-2xl bg-card p-8 shadow-card transition-all hover:shadow-card-hover">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-heading text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default HowItWorks;
