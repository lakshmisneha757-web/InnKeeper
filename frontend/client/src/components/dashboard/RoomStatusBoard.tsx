import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bed, Users, Star, Sparkles, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Room {
  id: number;
  number: string;
  name: string;
  type: string;
  floor: number;
  status: string;
  rate: number;
  capacity: number;
  amenities: string | null;
  isAvailable?: number;
}

interface RoomStatusBoardProps {
  rooms: Room[];
  onRoomClick: (data: { room: Room; guest?: any; reservation?: any }) => void;
}

const statusConfig: Record<string, { color: string; bg: string; border: string; key: string; dotColor: string }> = {
  vacant: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", key: "vacant", dotColor: "#10b981" },
  occupied: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", key: "occupied", dotColor: "#3b82f6" },
  dirty: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", key: "dirty", dotColor: "#f59e0b" },
  maintenance: { color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", key: "maintenance", dotColor: "#ef4444" },
  reserved: { color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", key: "reserved", dotColor: "#a855f7" },
};

const typeIcons: Record<string, typeof Bed> = {
  standard: Bed,
  deluxe: Star,
  suite: Star,
  premium: Star,
  family: Users,
};

export default function RoomStatusBoard({ rooms, onRoomClick }: RoomStatusBoardProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const roomsPerPage = 24;
  const totalPages = Math.ceil(rooms.length / roomsPerPage) || 1;
  const paginatedRooms = useMemo(() => {
    const start = (page - 1) * roomsPerPage;
    return rooms.slice(start, start + roomsPerPage);
  }, [rooms, page]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.02 },
    },
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 },
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Bed className="h-5 w-5 text-sky-600" />
            {t("dashboard.roomStatusBoard")}
          </CardTitle>
          <div className="flex items-center gap-2 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
            <Sparkles className="h-3.5 w-3.5" />
            {t("dashboard.roomsCount", { count: rooms.length })}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {Object.entries(statusConfig).map(([status, config]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: config.dotColor }}
              />
              <span className="text-xs text-muted-foreground">{t(`dashboard.${config.key}`)}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {rooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 py-12 text-center text-muted-foreground">
            <Bed className="mx-auto mb-4 h-12 w-12 opacity-30" />
            <p className="font-medium text-slate-700">{t("dashboard.noRoomsFound")}</p>
            <p className="mt-1 text-sm">{t("dashboard.adjustFilters")}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(new Set(paginatedRooms.map((r) => r.floor)))
              .sort((a, b) => a - b)
              .map((floorNum) => {
                const floorRooms = paginatedRooms.filter((r) => r.floor === floorNum);
                const vacantCount = floorRooms.filter((r) => r.status === "vacant").length;
                const occupiedCount = floorRooms.filter((r) => r.status === "occupied").length;

                return (
                  <div key={floorNum} className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <span>{t("dashboard.floor", { floor: floorNum })}</span>
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {t("dashboard.roomsCount", { count: floorRooms.length })}
                        </Badge>
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {t("dashboard.roomSummaryDetail", { vacant: vacantCount, occupied: occupiedCount })}
                      </span>
                    </div>
                    <motion.div
                      variants={container}
                      initial="hidden"
                      animate="show"
                      className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2.5 sm:gap-3"
                    >
                      {floorRooms.map((room) => {
                        const config = statusConfig[room.status] || statusConfig.vacant;
                        const roomTypeKey = String(room.type || "").toLowerCase();
                        const TypeIcon = typeIcons[roomTypeKey] || Bed;
                        return (
                          <motion.div
                            key={room.id}
                            variants={item}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onRoomClick({ room })}
                            draggable
                            onDragStart={(e) => {
                              (e as any).dataTransfer?.setData("text/plain", String(room.id));
                            }}
                            className={`relative rounded-2xl border bg-white/80 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${config.border} group overflow-hidden flex flex-col justify-between`}
                          >
                            {/* Status dot */}
                            <div
                              className="absolute top-2 right-2 h-2 w-2 rounded-full shadow-sm shrink-0"
                              style={{ backgroundColor: config.dotColor }}
                            />

                            {/* Room number and icon */}
                            <div>
                              <div className="mb-1 flex items-center justify-between pr-3">
                                <span className="text-sm font-semibold tracking-tight text-slate-900 truncate">{room.number}</span>
                                <TypeIcon
                                  className="h-3.5 w-3.5 shrink-0"
                                  style={{ color: config.dotColor, opacity: 0.7 }}
                                />
                              </div>

                              <div className="mb-2 text-[11px] capitalize text-slate-600 truncate" title={t(`dashboard.${roomTypeKey}`, room.type)}>
                                {t(`dashboard.${roomTypeKey}`, room.type)}
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                              <div className="flex flex-wrap items-center justify-between gap-1 min-w-0">
                                <Badge
                                  className="text-[9px] px-1.5 py-0.5 font-medium max-w-[75px] truncate"
                                  variant="secondary"
                                  style={{
                                    backgroundColor: `${config.dotColor}15`,
                                    color: config.dotColor,
                                  }}
                                  title={t(`dashboard.${config.key}`)}
                                >
                                  {t(`dashboard.${config.key}`)}
                                </Badge>
                                <span className="text-xs font-bold text-slate-900 shrink-0">₹{room.rate}</span>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-500 min-w-0 pt-0.5">
                                <div className="flex items-center gap-1 shrink-0">
                                  <Users className="h-3 w-3" />
                                  <span>{room.capacity}</span>
                                </div>
                                <div className="flex items-center gap-0.5 text-emerald-600 truncate">
                                  <ArrowUpRight className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{t("dashboard.ready")}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>

                  </div>
                );
              })}

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-muted-foreground">
              <span>{t("common.showing")} {Math.min(rooms.length, (page - 1) * roomsPerPage + 1)} - {Math.min(rooms.length, page * roomsPerPage)} {t("common.total")} {rooms.length}</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{t("common.previous")}</Button>
                <span className="text-xs font-bold text-foreground">Page {page} of {totalPages}</span>
                <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>{t("common.next")}</Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
