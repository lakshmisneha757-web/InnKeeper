import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  LogOut,
  DoorOpen,
  CreditCard,
  Car,
  BookOpen,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Users,
  CalendarDays,
  Sparkles,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Switch } from "./ui/switch";

const navGroups = [
  {
    label: "Main",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    ],
  },
  {
    label: "Front Desk",
    items: [
      { icon: CalendarDays, label: "Reservations", path: "/reservations" },
      { icon: ShieldCheck, label: "Check-In & Keys", path: "/checkin" },
      { icon: Users, label: "Guests", path: "/guests" },
      { icon: CreditCard, label: "Payments", path: "/payments" },
    ],
  },
  {
    label: "Operations",
    items: [
      { icon: Sparkles, label: "Housekeeping", path: "/housekeeping" },
      { icon: Wrench, label: "Maintenance", path: "/maintenance" },
      { icon: Car, label: "Vehicles", path: "/vehicles" },
      { icon: BookOpen, label: "Cash Ledger", path: "/cash-ledger" },
      { icon: ClipboardList, label: "Shift Audits", path: "/shift-audits" },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const [collapsed, setCollapsed] = useState(false);
  const [location, setLocation] = useLocation();
  const { theme, toggleTheme, switchable } = useTheme();
  const { logout } = useAuthContext();

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  if (loading) return <DashboardLayoutSkeleton />;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`relative flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out ${
          collapsed ? "w-[68px]" : "w-[240px]"
        } shrink-0`}
      >
        {/* Logo Header */}
        <div className="flex h-16 items-center border-b border-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shrink-0">
            <DoorOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="ml-3 text-sm font-bold tracking-tight truncate">
              InnKeeper
            </span>
          )}
          <button
            onClick={toggleCollapsed}
            className={`ml-auto flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ${
              collapsed ? "mx-auto mt-0 ml-auto" : ""
            }`}
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    item.path === "/"
                      ? location === "/"
                      : location.startsWith(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => setLocation(item.path)}
                      title={collapsed ? item.label : undefined}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      } ${collapsed ? "justify-center px-2" : ""}`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3 space-y-2">
          {/* Theme toggle */}
          {switchable && !collapsed && (
            <div className="flex items-center justify-between rounded-xl bg-accent/60 px-3 py-2">
              <div className="flex items-center gap-2">
                {theme === "dark" ? (
                  <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Sun className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="text-xs font-medium">
                  {theme === "dark" ? "Dark" : "Light"} Mode
                </span>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={() => toggleTheme?.()}
                className="scale-75"
              />
            </div>
          )}

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 hover:bg-accent transition-colors ${
                  collapsed ? "justify-center" : ""
                }`}
              >
                <Avatar className="h-8 w-8 shrink-0 border border-border">
                  <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {user?.role || "staff"}
                    </p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-52 mb-1">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-destructive focus:text-destructive mt-1"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/60 backdrop-blur px-6">
          <div>
            <h1 className="text-base font-semibold text-foreground">
              {navGroups.flatMap(g => g.items).find(i =>
                i.path === "/" ? location === "/" : location.startsWith(i.path)
              )?.label ?? "Dashboard"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {switchable && (
              <button
                onClick={() => toggleTheme?.()}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}
            <div className="h-8 w-px bg-border" />
            <Avatar className="h-8 w-8 border border-border cursor-pointer">
              <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
