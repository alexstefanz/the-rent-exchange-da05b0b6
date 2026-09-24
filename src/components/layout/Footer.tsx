import { Link } from "react-router-dom";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useLanguage } from "@/contexts/LanguageContext";
import logoImage from "@/assets/rentli_logo.webp";
import anpcSol from "@/assets/anpc-sol.webp.asset.json";
import anpcSal from "@/assets/anpc-sal.webp.asset.json";

const FacebookIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
    <defs>
      <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFDC80"/>
        <stop offset="25%" stopColor="#F77737"/>
        <stop offset="50%" stopColor="#E1306C"/>
        <stop offset="75%" stopColor="#C13584"/>
        <stop offset="100%" stopColor="#833AB4"/>
      </linearGradient>
    </defs>
    <path fill="url(#ig-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.08 4.08 0 011.47.96c.458.458.779.924.96 1.47.163.46.35 1.26.403 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.43a4.08 4.08 0 01-.96 1.47 4.08 4.08 0 01-1.47.96c-.46.163-1.26.35-2.43.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.403a4.08 4.08 0 01-1.47-.96 4.08 4.08 0 01-.96-1.47c-.163-.46-.35-1.26-.403-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.43a4.08 4.08 0 01.96-1.47 4.08 4.08 0 011.47-.96c.46-.163 1.26-.35 2.43-.403C8.416 2.175 8.796 2.163 12 2.163M12 0C8.741 0 8.333.014 7.053.072 5.775.13 4.903.333 4.14.63a5.876 5.876 0 00-2.126 1.384A5.876 5.876 0 00.63 4.14C.333 4.903.13 5.775.072 7.053.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.058 1.278.261 2.15.558 2.913a5.876 5.876 0 001.384 2.126A5.876 5.876 0 004.14 23.37c.763.297 1.635.5 2.913.558C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c1.278-.058 2.15-.261 2.913-.558a5.876 5.876 0 002.126-1.384 5.876 5.876 0 001.384-2.126c.297-.763.5-1.635.558-2.913C23.986 15.667 24 15.259 24 12s-.014-3.667-.072-4.947c-.058-1.278-.261-2.15-.558-2.913a5.876 5.876 0 00-1.384-2.126A5.876 5.876 0 0019.86.63C19.097.333 18.225.13 16.947.072 15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"/>
  </svg>
);

const TiktokIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.17a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.6z"/>
  </svg>
);

const Footer = () => {
  const copy = useUxCopy();
  const { language } = useLanguage();

  return <footer className="border-t border-border bg-secondary/30">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoImage} alt="Rentli" width={120} height={40} className="h-10 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground">
              {copy.footer.description}
            </p>
            <div className="flex items-center gap-3">
              <a href="https://www.facebook.com/profile.php?id=61587757203847" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-80">
                <FacebookIcon size={20} />
              </a>
              <a href="https://www.instagram.com/rentli_romania/" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-80">
                <InstagramIcon size={20} />
              </a>
              <a href="https://www.tiktok.com/@rentli_romania" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-80">
                <TiktokIcon size={20} />
              </a>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <a href="https://anpc.ro/ce-este-sol/" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-80">
                <img src={anpcSol.url} alt="ANPC - Soluționarea online a litigiilor" className="h-10 w-auto" />
              </a>
              <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-80">
                <img src={anpcSal.url} alt="ANPC - Soluționarea alternativă a litigiilor" className="h-10 w-auto" />
              </a>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <h4 className="font-heading text-sm font-semibold">{language === "en" ? "Company" : "Companie"}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/despre-noi" className="transition-colors hover:text-foreground">{language === "en" ? "About us" : "Despre noi"}</Link></li>
                <li><Link to="/contact" className="transition-colors hover:text-foreground">{language === "en" ? "Contact us" : "Contactează-ne"}</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-heading text-sm font-semibold">{language === "en" ? "Useful" : "Utile"}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/categorii" className="transition-colors hover:text-foreground">{language === "en" ? "All categories" : "Vezi toate categoriile"}</Link></li>
                <li><Link to="/cauta" className="transition-colors hover:text-foreground">{language === "en" ? "Search products" : "Caută produse"}</Link></li>
                <li><Link to="/adauga-anunt" className="transition-colors hover:text-foreground">{language === "en" ? "Post a listing" : "Publică un anunț"}</Link></li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-sm font-semibold">{language === "en" ? "Your account" : "Contul tău"}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/auth" className="transition-colors hover:text-foreground">{language === "en" ? "Sign in / Register" : "Intră în cont / Înregistrează-te"}</Link></li>
              <li><Link to="/mesaje" className="transition-colors hover:text-foreground">Chat</Link></li>
              <li><Link to="/anunturi" className="transition-colors hover:text-foreground">{language === "en" ? "My listings" : "Anunțurile mele"}</Link></li>
              <li><Link to="/anunturi?tab=cereri" className="transition-colors hover:text-foreground">{language === "en" ? "Rentals out" : "Închirieri"}</Link></li>
              <li><Link to="/rezervari" className="transition-colors hover:text-foreground">{language === "en" ? "Bookings" : "Rezervări"}</Link></li>
              <li><Link to="/favorite" className="transition-colors hover:text-foreground">{language === "en" ? "Favorites" : "Favorite"}</Link></li>
              <li><Link to="/suport" className="transition-colors hover:text-foreground">{language === "en" ? "Support & Tickets" : "Suport & Tickete"}</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-sm font-semibold">{language === "en" ? "Customer support" : "Suport clienți"}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/cum-functioneaza" className="transition-colors hover:text-foreground">{language === "en" ? "How it works" : "Cum funcționează"}</Link></li>
              <li><Link to="/intrebari-frecvente" className="transition-colors hover:text-foreground">{language === "en" ? "FAQ" : "Întrebări frecvente"}</Link></li>
              <li><Link to="/termeni-si-conditii" className="transition-colors hover:text-foreground">{language === "en" ? "Terms and conditions" : "Termeni și condiții"}</Link></li>
              <li><Link to="/politica-confidentialitate" className="transition-colors hover:text-foreground">{language === "en" ? "Privacy policy" : "Politica de confidențialitate"}</Link></li>
              <li><Link to="/politica-anulare" className="transition-colors hover:text-foreground">{language === "en" ? "Cancellation policy" : "Politica de anulare"}</Link></li>
              <li><Link to="/politica-cookies" className="transition-colors hover:text-foreground">{language === "en" ? "Cookie policy" : "Politica de cookies"}</Link></li>
              <li><button type="button" onClick={() => window.Cookiebot?.renew()} className="transition-colors hover:text-foreground text-left">{language === "en" ? "Cookie settings" : "Setări cookie-uri"}</button></li>
              <li><a href="https://anpc.ro" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">ANPC</a></li>
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
