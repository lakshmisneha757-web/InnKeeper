import { useMemo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface Room {
  id: number;
  number: string;
  type: string;
  floor: number;
  status: string;
  rate: number;
}

interface RoomHeatmapProps {
  rooms: Room[];
}

const statusIntensity: Record<string, number> = {
  vacant: 0.1,
  occupied: 0.9,
  dirty: 0.5,
  maintenance: 0.7,
  reserved: 0.6,
};

const statusColor: Record<string, string> = {
  vacant: "#10b981",
  occupied: "#3b82f6",
  dirty: "#f59e0b",
  maintenance: "#ef4444",
  reserved: "#a855f7",
};

export default function RoomHeatmap({ rooms }: RoomHeatmapProps) {
  const floors = useMemo(() => {
    const floorMap = new Map<number, Room[]>();
    rooms.forEach((room) => {
      if (!floorMap.has(room.floor)) {
        floorMap.set(room.floor, []);
      }
      floorMap.get(room.floor)!.push(room);
    });
    return Array.from(floorMap.entries()).sort((a, b) => b[0] - a[0]);
  }, [rooms]);

  const occupancyByFloor = useMemo(() => {
    return floors.map(([floor, floorRooms]) => {
      const occupied = floorRooms.filter((r) => r.status === "occupied").length;
      return {
        floor,
        total: floorRooms.length,
        occupied,
        percentage: floorRooms.length > 0 ? Math.round((occupied / floorRooms.length) * 100) : 0,
      };
    });
  }, [floors]);

  return (
    <div className="space-y-3">
      {floors.map(([floor, floorRooms]) => {
        const floorData = occupancyByFloor.find((f) => f.floor === floor);
        return (
          <div key={floor} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Floor {floor}</span>
              <span className="text-xs text-muted-foreground">
                {floorData?.occupied}/{floorData?.total} occupied
              </span>
            </div>
            <div className="flex gap-1.5">
              {floorRooms.map((room, i) => {
                const intensity = statusIntensity[room.status] || 0.3;
                const color = statusColor[room.status] || "#6b7280";
                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.02, duration: 0.15 }}
                    className="relative group"
                  >
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:shadow-lg"
                      style={{
                        backgroundColor: color,
                        opacity: 0.2 + intensity * 0.8,
                      }}
                      title={`Room ${room.number} - ${room.status}`}
                    >
                      <span className="text-[10px] font-bold text-white">
                        {room.number}
                      </span>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-popover border rounded-lg px-2 py-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-lg">
                      <p className="font-medium">Room {room.number}</p>
                      <p className="text-muted-foreground capitalize">{room.status} · {room.type}</p>
                      <p className="font-medium">${room.rate}/night</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2 border-t">
        {Object.entries(statusColor).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[10px] text-muted-foreground capitalize">
              {status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
