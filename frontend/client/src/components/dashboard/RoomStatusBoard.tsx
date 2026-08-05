import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bed, Users, Star, Sparkles, ArrowUpRight } from "lucide-react";

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

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string; dotColor: string }> = {
  vacant: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "Vacant", dotColor: "#10b981" },
  occupied: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", label: "Occupied", dotColor: "#3b82f6" },
  dirty: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "Dirty", dotColor: "#f59e0b" },
  maintenance: { color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", label: "Maintenance", dotColor: "#ef4444" },
  reserved: { color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", label: "Reserved", dotColor: "#a855f7" },
};

const typeIcons: Record<string, typeof Bed> = {
  standard: Bed,
  deluxe: Star,
  suite: Star,
  premium: Star,
  family: Users,
};

export default function RoomStatusBoard({ rooms, onRoomClick }: RoomStatusBoardProps) {
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
            Room Status Board
          </CardTitle>
          <div className="flex items-center gap-2 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
            <Sparkles className="h-3.5 w-3.5" />
            {rooms.length} rooms
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {Object.entries(statusConfig).map(([status, config]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: config.dotColor }}
              />
              <span className="text-xs text-muted-foreground">{config.label}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {rooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 py-12 text-center text-muted-foreground">
            <Bed className="mx-auto mb-4 h-12 w-12 opacity-30" />
            <p className="font-medium text-slate-700">No rooms found</p>
            <p className="mt-1 text-sm">Adjust the filters to explore more rooms.</p>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          >
            {rooms.map((room) => {
              const config = statusConfig[room.status] || statusConfig.vacant;
              const TypeIcon = typeIcons[room.type] || Bed;
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
                  className={`relative rounded-2xl border bg-white/80 p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${config.border} group`}
                >
                  {/* Status dot */}
                  <div
                    className="absolute top-2 right-2 h-2 w-2 rounded-full shadow-sm"
                    style={{ backgroundColor: config.dotColor }}
                  />

                  {/* Room number and icon */}
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold tracking-tight text-slate-900">{room.number}</span>
                    <TypeIcon
                      className="h-3.5 w-3.5"
                      style={{ color: config.dotColor, opacity: 0.7 }}
                    />
                  </div>

                  <div className="mb-2 text-[11px] capitalize text-slate-600">{room.type}</div>

                  <div className="flex items-center justify-between">
                    <Badge
                      className="text-[10px] font-medium"
                      variant="secondary"
                      style={{
                        backgroundColor: `${config.dotColor}15`,
                        color: config.dotColor,
                      }}
                    >
                      {config.label}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-900">${room.rate}</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{room.capacity}</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600">
                      <ArrowUpRight className="h-3 w-3" />
                      <span>Ready</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
