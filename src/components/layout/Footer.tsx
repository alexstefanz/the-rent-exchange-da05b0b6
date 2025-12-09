import { Package } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-heading text-lg font-semibold">ÎnchiriazăAcum</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Platforma ta de încredere pentru închiriere. Găsește sau oferă orice ai nevoie.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-sm font-semibold">Explorează</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/categorii" className="transition-colors hover:text-foreground">
                  Toate Categoriile
                </Link>
              </li>
              <li>
                <Link to="/cauta" className="transition-colors hover:text-foreground">
                  Caută Produse
                </Link>
              </li>
              <li>
                <Link to="/categorie/1" className="transition-colors hover:text-foreground">
                  Outdoor & Aventură
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-sm font-semibold">Publică</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/adauga-anunt" className="transition-colors hover:text-foreground">
                  Adaugă Anunț
                </Link>
              </li>
              <li>
                <Link to="#" className="transition-colors hover:text-foreground">
                  Cum Funcționează
                </Link>
              </li>
              <li>
                <Link to="#" className="transition-colors hover:text-foreground">
                  Prețuri
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-sm font-semibold">Suport</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="#" className="transition-colors hover:text-foreground">
                  Centru de Ajutor
                </Link>
              </li>
              <li>
                <Link to="#" className="transition-colors hover:text-foreground">
                  Contactează-ne
                </Link>
              </li>
              <li>
                <Link to="#" className="transition-colors hover:text-foreground">
                  Termeni și Condiții
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ÎnchiriazăAcum. Toate drepturile rezervate.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
