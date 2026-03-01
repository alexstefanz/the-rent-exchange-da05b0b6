import { Link } from "react-router-dom";
import { useUxCopy } from "@/hooks/useUxCopy";
import logoImage from "@/assets/rentli_logo.png";
import { Facebook, Instagram } from "lucide-react";

const TiktokIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const Footer = () => {
  const copy = useUxCopy();

  return <footer className="border-t border-border bg-secondary/30">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoImage} alt="Rentli" className="h-8 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground">
              {copy.footer.description}
            </p>
            <div className="flex items-center gap-3">
              <a href="https://www.facebook.com/profile.php?id=61587757203847" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-foreground">
                <Facebook size={20} />
              </a>
              <a href="https://www.instagram.com/rentli_romania/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-foreground">
                <Instagram size={20} />
              </a>
              <a href="https://www.tiktok.com/@rentli_romania" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-foreground">
                <TiktokIcon size={20} />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-sm font-semibold">{copy.footer.explore}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/categorii" className="transition-colors hover:text-foreground">
                  {copy.footer.allCategories}
                </Link>
              </li>
              <li>
                <Link to="/cauta" className="transition-colors hover:text-foreground">
                  {copy.footer.searchProducts}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-sm font-semibold">{copy.footer.publish}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/adauga-anunt" className="transition-colors hover:text-foreground">
                  {copy.footer.addListing}
                </Link>
              </li>
              <li>
                <Link to="/cum-functioneaza" className="transition-colors hover:text-foreground">
                  {copy.footer.howItWorks}
                </Link>
              </li>
              <li>
                <Link to="#" className="transition-colors hover:text-foreground">
                  {copy.footer.pricing}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-sm font-semibold">{copy.footer.support}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/intrebari-frecvente" className="transition-colors hover:text-foreground">
                  Întrebări frecvente
                </Link>
              </li>
              <li>
                <Link to="/centru-asistenta" className="transition-colors hover:text-foreground">
                  {copy.footer.helpCenter}
                </Link>
              </li>
              <li>
                <Link to="/despre-noi" className="transition-colors hover:text-foreground">
                  Despre Noi
                </Link>
              </li>
              <li>
                <Link to="/termeni-si-conditii" className="transition-colors hover:text-foreground">
                  {copy.footer.terms}
                </Link>
              </li>
              <li>
                <Link to="/politica-confidentialitate" className="transition-colors hover:text-foreground">
                  Confidențialitate
                </Link>
              </li>
              <li>
                <Link to="/politica-anulare" className="transition-colors hover:text-foreground">
                  Politica de anulare
                </Link>
              </li>
              <li>
                <Link to="/politica-cookies" className="transition-colors hover:text-foreground">
                  Cookie-uri
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {copy.footer.copyright}</p>
        </div>
      </div>
    </footer>;
};
export default Footer;
