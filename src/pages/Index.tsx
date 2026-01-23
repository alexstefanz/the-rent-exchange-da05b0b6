import { Link } from "react-router-dom";
import { ArrowRight, Shield, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSearchForm from "@/components/HeroSearchForm";
import { categories } from "@/data/categories";
import { getCategoryIcon } from "@/data/categoryIcons";

const Index = () => {
  // Cele mai căutate categorii - primele 9 pentru grid
  const popularCategoryIds = [1, 2, 6, 7, 22, 19, 4, 5, 9];
  const popularCategories = categories.filter(c => popularCategoryIds.includes(c.id));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div className="container relative pt-16 pb-8 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="animate-fade-up font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Închiriază ce ai nevoie,{" "}
              <span className="text-primary">când ai nevoie</span>
            </h1>
            <p className="mt-6 animate-fade-up text-lg text-muted-foreground md:text-xl" style={{ animationDelay: "0.1s" }}>
              Platforma ta de încredere pentru închiriere. Găsește echipamente, 
              vehicule și multe altele de la oameni din comunitatea ta.
            </p>
            
            {/* Search Form */}
            <div className="mx-[-12px] mt-6 animate-fade-up md:mx-0 md:mt-10" style={{ animationDelay: "0.2s" }}>
              <HeroSearchForm />
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories - Icon Grid Style */}
      <section className="py-16">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-3xl font-semibold text-foreground">
              Categorii principale
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9">
            {popularCategories.map((category) => {
              const Icon = getCategoryIcon(category.id);
              // Generate a color for each category based on its ID
              const colors = [
                "bg-yellow-100",
                "bg-blue-100",
                "bg-amber-100",
                "bg-orange-100",
                "bg-indigo-100",
                "bg-emerald-100",
                "bg-pink-100",
                "bg-cyan-100",
                "bg-rose-100",
              ];
              const colorIndex = (category.id - 1) % colors.length;
              const bgColor = colors[colorIndex];

              return (
                <Link
                  key={category.id}
                  to={`/categorie/${category.id}`}
                  className="group flex flex-col items-center text-center"
                >
                  <div
                    className={`mb-3 flex h-16 w-16 items-center justify-center rounded-full ${bgColor} transition-transform group-hover:scale-110 sm:h-20 sm:w-20`}
                  >
                    <Icon className="h-8 w-8 text-foreground sm:h-10 sm:w-10" />
                  </div>
                  <p className="text-xs font-medium text-foreground sm:text-sm">
                    {category.name.split(" & ")[0]}
                    {category.name.includes("&") && (
                      <>
                        <br />
                        <span className="text-muted-foreground">
                          {category.name.split(" & ")[1]?.split(" ")[0]}
                        </span>
                      </>
                    )}
                  </p>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Button variant="outline" asChild>
              <Link to="/categorii">
                Vezi Toate Categoriile
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-border bg-secondary/30 py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-3xl font-semibold text-foreground">
              Cum Funcționează
            </h2>
            <p className="mt-2 text-muted-foreground">
              Închirierea simplificată în trei pași
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: "Găsește Ce Ai Nevoie",
                description: "Răsfoiește mii de produse disponibile în zona ta, de la camere foto la echipament de camping.",
              },
              {
                icon: Clock,
                title: "Rezervă & Ridică",
                description: "Alege perioada, coordonează cu proprietarul și ridică produsul când îți convine.",
              },
              {
                icon: Shield,
                title: "Închiriază cu Încredere",
                description: "Fiecare închiriere este protejată. Returnează produsul și lasă o recenzie când termini.",
              },
            ].map((step) => (
              <div
                key={step.title}
                className="group rounded-2xl bg-card p-8 shadow-card transition-all hover:shadow-card-hover"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-heading text-xl font-semibold">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="rounded-3xl bg-primary p-12 text-center md:p-16">
            <h2 className="font-heading text-3xl font-semibold text-primary-foreground md:text-4xl">
              Ai Ceva de Închiriat?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Transformă obiectele nefolosite în venit. Listează gratuit și începe să câștigi azi.
            </p>
            <Button
              variant="secondary"
              size="xl"
              className="mt-8"
              asChild
            >
              <Link to="/adauga-anunt">
                Începe Să Listezi
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
