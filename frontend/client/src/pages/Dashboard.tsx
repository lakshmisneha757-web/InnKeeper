import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bed,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Bell,
  BellOff,
  Sparkles,
  Grid2x2,
  X,
  ArrowRightLeft,
} from "lucide-react";
import MetricsDashboard from "@/components/dashboard/MetricsDashboard";
import RoomStatusBoard from "@/components/dashboard/RoomStatusBoard";
import TapeChart from "@/components/dashboard/TapeChart";
import ArrivalsDepartures from "@/components/dashboard/ArrivalsDepartures";
import NotificationCenter from "@/components/dashboard/NotificationCenter";
import RoomDetailsDrawer from "@/components/dashboard/RoomDetailsDrawer";

import Module5Widgets from "@/components/dashboard/Module5Widgets";
import { useTheme } from "@/contexts/ThemeContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const {
    rooms, setRooms,
    filterType, setFilterType,
    filterFloor, setFilterFloor,
    filterStatus, setFilterStatus,
    searchQuery, setSearchQuery,
    selectedRoom, setSelectedRoom,
    tapeChartStartDate, setTapeChartStartDate,
    reservations, setReservations,
    guests, setGuests,
    notifications, setNotifications,
    unreadCount, setUnreadCount,
    showAIAssistant,
    showAIPrediction,
    showAIInsights,
    showHeatmap,
  } = useStore();

  const { theme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch data via REST API
  const [isLoading, setIsLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [roomsResp, reservationsResp, guestsResp, notificationsResp] = await Promise.all([
        apiClient.rooms.list(),
        apiClient.reservations.list(),
        apiClient.guests.list(),
        apiClient.notifications.list(),
      ]);

      const roomsData = roomsResp?.data?.items ?? roomsResp?.data ?? [];
      const reservationsData = reservationsResp?.data?.items ?? reservationsResp?.data ?? [];
      const guestsData = guestsResp?.data?.items ?? guestsResp?.data ?? [];
      const notificationsData = notificationsResp?.data?.items ?? notificationsResp?.data ?? [];

      setRooms(roomsData as any);
      setReservations(reservationsData as any);
      setGuests(guestsData as any);
      setNotifications(notificationsData as any);
      setUnreadCount((notificationsData as any[]).filter((n: any) => !n.isRead).length || 0);
    } catch (e) {
      console.warn("Failed to fetch dashboard data", e);
    } finally {
      setIsLoading(false);
    }
  }, [setRooms, setReservations, setGuests, setNotifications, setUnreadCount]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room: any) => {
      if (filterType !== "all" && room.type !== filterType) return false;
      if (filterFloor !== null && room.floor !== filterFloor) return false;
      if (filterStatus !== "all" && room.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const guest = guests.find((g: any) => {
          const res = reservations.find((r: any) => r.roomId === room.id && r.guestId === g.id);
          return res;
        });
        const matchesName = `${room.number} ${room.name}`.toLowerCase().includes(q);
        const matchesGuest = guest ?
          `${(guest as any).firstName} ${(guest as any).lastName}`.toLowerCase().includes(q) :
          false;
        return matchesName || matchesGuest;
      }
      return true;
    });
  }, [rooms, filterType, filterFloor, filterStatus, searchQuery, guests, reservations]);

  const navigateTapeChart = useCallback((direction: number) => {
    const newDate = new Date(tapeChartStartDate);
    newDate.setDate(newDate.getDate() + direction);
    setTapeChartStartDate(newDate);
  }, [tapeChartStartDate, setTapeChartStartDate]);

  const statusColors: Record<string, string> = {
    vacant: "bg-emerald-500",
    occupied: "bg-blue-500",
    dirty: "bg-amber-500",
    maintenance: "bg-red-500",
    reserved: "bg-purple-500",
  };

  const statusLabels: Record<string, string> = {
    vacant: "Vacant",
    occupied: "Occupied",
    dirty: "Dirty",
    maintenance: "Maintenance",
    reserved: "Reserved",
  };

  // `isLoading` from REST fetch

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200/80 bg-white/75 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-sky-700">
              <Sparkles className="h-4 w-4" />
              Luxury reception control center
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">InnKeeper Hospitality Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
           
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-2xl"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              {unreadCount > 0 ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Notification Center */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <NotificationCenter onClose={() => setShowNotifications(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tape-chart">Tape Chart</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="arrivals">Arrivals</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-[1.5rem]" />
                ))}
              </div>
              <Skeleton className="h-50 rounded-[1.5rem]" />
              <Skeleton className="h-50 rounded-[1.5rem]" />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40 rounded-[1.5rem]" />
                ))}
              </div>
              <Skeleton className="h-75 rounded-[1.5rem]" />
            </div>
          ) : (
            <>
          {/* Metrics */}
          <MetricsDashboard rooms={filteredRooms} reservations={reservations} />

          {/* AI Panels Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
          </div>

          {/* AI Room Assignment */}
          

          {/* Module 5 widgets */}
          <Module5Widgets />

          {/* Room Status Board */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3">
              <RoomStatusBoard
                rooms={filteredRooms as any}
                onRoomClick={(data: any) => setSelectedRoom(data as any)}
              />
            </div>
            <div className="space-y-4">
              <ArrivalsDepartures rooms={rooms as any} reservations={reservations as any} guests={guests as any} />
            </div>
          </div>
            </>
          )}
        </TabsContent>

        {/* Tape Chart Tab */}
        <TabsContent value="tape-chart" className="mt-6">
          <Card className="overflow-hidden border-slate-200/80 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Calendar className="h-5 w-5 text-sky-600" />
                    Tape Chart
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => navigateTapeChart(-7)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="min-w-50 text-center text-sm font-medium">
                      {tapeChartStartDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {" — "}
                      {new Date(tapeChartStartDate.getTime() + 13 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <Button variant="outline" size="icon" onClick={() => navigateTapeChart(7)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setTapeChartStartDate(new Date())}>
                      Today
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {Object.entries(statusLabels).map(([status, label]) => (
                    <div key={status} className="flex items-center gap-1.5">
                      <div className={`h-2.5 w-2.5 rounded-full ${statusColors[status]}`} />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TapeChart
                rooms={filteredRooms as any}
                reservations={reservations as any}
                startDate={tapeChartStartDate}
                days={14}
                guests={guests as any}
                onRoomClick={(data: any) => setSelectedRoom(data as any)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="space-y-6 mt-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative max-w-md flex-1 min-w-50">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search rooms or guests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                  <SelectTrigger className="w-37.5">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="deluxe">Deluxe</SelectItem>
                    <SelectItem value="suite">Suite</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={String(filterFloor ?? "all")}
                  onValueChange={(v) => setFilterFloor(v === "all" ? null : Number(v))}
                >
                  <SelectTrigger className="w-30">
                    <SelectValue placeholder="All Floors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Floors</SelectItem>
                    <SelectItem value="1">Floor 1</SelectItem>
                    <SelectItem value="2">Floor 2</SelectItem>
                    <SelectItem value="3">Floor 3</SelectItem>
                    <SelectItem value="4">Floor 4</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                  <SelectTrigger className="w-37.5">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="dirty">Dirty</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Search Results Summary */}
          {searchQuery && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <span>Showing {filteredRooms.length} result{filteredRooms.length !== 1 ? "s" : ""} for "{searchQuery}"</span>
              {filteredRooms.length === 0 && (
                <span className="text-destructive">— No rooms or guests match your search</span>
              )}
            </div>
          )}

          {/* Room Grid */}
          <RoomStatusBoard
            rooms={filteredRooms as any}
            onRoomClick={(data: any) => setSelectedRoom(data as any)}
          />
        </TabsContent>

        {/* Arrivals & Departures Tab */}
        <TabsContent value="arrivals" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ArrivalsDepartures rooms={rooms as any} reservations={reservations as any} guests={guests as any} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Room Details Drawer */}
      <RoomDetailsDrawer
        isOpen={!!selectedRoom}
        onClose={() => setSelectedRoom(null)}
        room={selectedRoom?.room ?? null}
        guest={selectedRoom?.guest ?? null}
        reservation={selectedRoom?.reservation ?? null}
      />

      {/* AI Assistant */}
     
    </div>
  );
}
