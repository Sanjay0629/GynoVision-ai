import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Activity, Menu, X } from "lucide-react";

const navItems = [
  { path: "/", label: "Home" },
  { path: "/#prediction-modules", label: "Predict" },
  { path: "/about", label: "About" },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [activeHash, setActiveHash] = useState("");

  // Track scroll position to update active nav item
  useEffect(() => {
    if (location.pathname !== "/") return;

    const section = document.getElementById("prediction-modules");
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setActiveHash(entry.isIntersecting ? "prediction-modules" : "");
      },
      { threshold: 0.3 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [location.pathname]);

  const handleNavClick = (path: string) => {
    if (path.includes("#")) {
      const [route, hash] = path.split("#");
      setActiveHash(hash);
      if (location.pathname === route || (route === "/" && location.pathname === "/")) {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate(route || "/");
        setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } else {
      setActiveHash("");
      if (location.pathname === path) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        navigate(path);
      }
    }
    setMobileOpen(false);
  };

  const isActive = (item: { path: string }) => {
    if (item.path.includes("#")) {
      const hash = item.path.split("#")[1];
      return location.pathname === "/" && activeHash === hash;
    }
    return location.pathname === item.path && !activeHash;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
            <Activity className="h-6 w-6 text-primary" />
            GynoVision AI
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="lg:hidden border-t border-border bg-card p-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                  isActive(item)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-card py-8">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold text-foreground">GynoVision AI</span>
          </div>
          <p className="text-xs text-muted-foreground max-w-lg mx-auto">
            Academic research tool for decision support. Not intended for clinical diagnosis.
            © {new Date().getFullYear()} GynoVision AI Research Project.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
