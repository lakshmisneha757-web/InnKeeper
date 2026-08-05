import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Lightbulb, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useMemo } from "react";

interface Room {
  id: number;
  number: string;
  status: string;
  rate: number;
}

interface Reservation {
  id: number;
  status: string;
  totalCharges: number | null;
}

interface InsightsResponse {
  insights: Array<{
    title: string;
    description: string;
    priority: string;
    action: string;
  }>;
  overallHealth: string;
  recommendations: string[];
  weeklyTrend: string;
}

interface AIInsightsPanelProps {
  rooms: Room[];
  reservations: Reservation[];
}

export default function AIInsightsPanel({ rooms, reservations }: AIInsightsPanelProps) {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const mutation = trpc.ai.insights.useMutation();

  const metrics = useMemo(() => {
    const total = rooms.length;
    const occupied = rooms.filter((r) => r.status === "occupied").length;
    const occupancy = total > 0 ? Math.round((occupied / total) * 100) : 0;
    const activeRes = reservations.filter((r) => r.status === "checked_in" || r.status === "confirmed");
    const revenue = activeRes.reduce((sum, r) => sum + (r.totalCharges || 0), 0);
    const adr = activeRes.length > 0 ? revenue / activeRes.length : 0;
    const revpar = adr * (occupancy / 100);
    return { occupancy, adr, revpar, totalRooms: total };
  }, [rooms, reservations]);

  const handleGenerate = async () => {
    try {
      const result = await mutation.mutateAsync(metrics);
      setData(result);
      toast.success("AI insights generated");
    } catch {
      toast.error("Failed to generate insights");
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-2"
      >
        <Lightbulb className="h-4 w-4" />
        AI Insights
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              AI Insights Widget
              <Badge variant="outline" className="text-[10px]">Beta</Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGenerate}
            disabled={mutation.isPending}
            size="sm"
            className="w-full mb-3"
            variant="outline"
          >
            {mutation.isPending ? (
              <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
            ) : (
              <Lightbulb className="h-3.5 w-3.5 mr-2" />
            )}
            {mutation.isPending ? "Analyzing..." : "Generate Insights"}
          </Button>

          {data ? (
            <div className="space-y-3">
              {/* Overall Health */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/50">
                {data.overallHealth === "excellent" || data.overallHealth === "good" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                <span className="text-sm font-medium capitalize">{data.overallHealth.replace("_", " ")}</span>
                <Badge variant="secondary" className="ml-auto text-xs capitalize">
                  {data.weeklyTrend}
                </Badge>
              </div>

              {/* Insights */}
              <div className="space-y-2">
                {data.insights.slice(0, 3).map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-2 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{insight.title}</span>
                      <Badge
                        variant={
                          insight.priority === "high" ? "destructive" :
                          insight.priority === "medium" ? "secondary" : "outline"
                        }
                        className="text-[10px]"
                      >
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                  </motion.div>
                ))}
              </div>

              {/* Recommendations */}
              <div>
                <p className="text-xs font-medium mb-1">Recommendations</p>
                <ul className="space-y-1">
                  {data.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-primary mt-1.5 shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Click to generate AI insights</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
