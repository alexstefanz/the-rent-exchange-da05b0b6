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
              <span className="font-heading text-lg font-semibold">RentHub</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              The marketplace for renting anything. List your items or find what you need.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-sm font-semibold">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/browse" className="transition-colors hover:text-foreground">
                  Browse Items
                </Link>
              </li>
              <li>
                <Link to="/browse?category=electronics" className="transition-colors hover:text-foreground">
                  Electronics
                </Link>
              </li>
              <li>
                <Link to="/browse?category=tools" className="transition-colors hover:text-foreground">
                  Tools & Equipment
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-sm font-semibold">List</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/list-item" className="transition-colors hover:text-foreground">
                  List an Item
                </Link>
              </li>
              <li>
                <Link to="#" className="transition-colors hover:text-foreground">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="#" className="transition-colors hover:text-foreground">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-sm font-semibold">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="#" className="transition-colors hover:text-foreground">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="#" className="transition-colors hover:text-foreground">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="#" className="transition-colors hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} RentHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
