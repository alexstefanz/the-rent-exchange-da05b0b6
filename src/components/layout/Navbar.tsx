import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, Plus, Search } from "lucide-react";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-semibold text-foreground">
            RentHub
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            to="/browse"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="h-4 w-4" />
            Browse
          </Link>
          <Link
            to="/list-item"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            List an Item
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="hidden md:flex">
            Sign In
          </Button>
          <Button size="sm" asChild>
            <Link to="/list-item">
              <Plus className="h-4 w-4" />
              List Item
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
