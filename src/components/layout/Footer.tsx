import { Package } from "lucide-react";
import { Link } from "react-router-dom";
import { useUxCopy } from "@/hooks/useUxCopy";

const Footer = () => {
  const copy = useUxCopy();

  return <footer className="border-t border-border bg-secondary/30">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-heading text-lg font-semibold">RentNow</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {copy.footer.description}
            </p>
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
              <li>
                <Link to="/categorie/1" className="transition-colors hover:text-foreground">
                  {copy.footer.outdoorAdventure}
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
                <Link to="#" className="transition-colors hover:text-foreground">
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
                <Link to="#" className="transition-colors hover:text-foreground">
                  {copy.footer.helpCenter}
                </Link>
              </li>
              <li>
                <Link to="#" className="transition-colors hover:text-foreground">
                  {copy.footer.contactUs}
                </Link>
              </li>
              <li>
                <Link to="#" className="transition-colors hover:text-foreground">
                  {copy.footer.terms}
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
