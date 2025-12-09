import { Link } from "react-router-dom";
import { ArrowRight, Shield, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoryCard from "@/components/items/CategoryCard";
import { categories } from "@/data/categories";
import { getCategoryIcon } from "@/data/categoryIcons";

const Index = () => {
  const featuredCategories = categories.slice(0, 6);
  
  // Cele mai căutate categorii
  const popularCategoryIds = [1, 2, 6, 7, 22, 19];
  const popularCategories = categories.filter(c => popularCategoryIds.includes(c.id));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div className="container relative py-16 md:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left content */}
            <div className="text-center lg:text-left">
              <h1 className="animate-fade-up font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                Închiriază ce ai nevoie,{" "}
                <span className="text-primary">când ai nevoie</span>
              </h1>
              <p className="mt-6 animate-fade-up text-lg text-muted-foreground md:text-xl" style={{ animationDelay: "0.1s" }}>
                Platforma ta de încredere pentru închiriere. Găsește echipamente, 
                vehicule și multe altele de la oameni din comunitatea ta.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 animate-fade-up sm:flex-row lg:justify-start" style={{ animationDelay: "0.2s" }}>
                <Button variant="hero" size="xl" asChild>
                  <Link to="/categorii">
                    Explorează Categorii
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link to="/adauga-anunt">Adaugă Anunț</Link>
                </Button>
              </div>
            </div>

            {/* Right content - Illustration placeholder */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8">
                  <div className="grid h-full grid-cols-2 gap-4">
                    {[1, 2, 7, 22].map((id, index) => {
                      const cat = categories.find(c => c.id === id);
                      const Icon = getCategoryIcon(id);
                      return (
                        <div 
                          key={id}
                          className="flex flex-col items-center justify-center rounded-2xl bg-card p-4 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-1"
                          style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                        >
                          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <p className="text-center text-xs font-medium text-foreground">
                            {cat?.name.split(' ')[0]}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Categories Chips */}
          <div className="mt-12 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <p className="mb-4 text-center text-sm font-medium text-muted-foreground lg:text-left">
              Cele mai căutate categorii:
            </p>
            <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
              {popularCategories.map((category) => {
                const Icon = getCategoryIcon(category.id);
                return (
                  <Link
                    key={category.id}
                    to={`/categorie/${category.id}`}
                    className="flex items-center gap-2 rounded-full border-2 border-primary/30 bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    {category.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-20">
        <div className="container">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-heading text-3xl font-semibold text-foreground">
                Categorii Populare
              </h2>
              <p className="mt-2 text-muted-foreground">
                Descoperă cele mai căutate categorii de închiriere
              </p>
            </div>
            <Button variant="ghost" asChild className="hidden md:flex">
              <Link to="/categorii">
                Vezi Toate
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCategories.map((category, index) => (
              <div
                key={category.id}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CategoryCard category={category} />
              </div>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Button asChild>
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
