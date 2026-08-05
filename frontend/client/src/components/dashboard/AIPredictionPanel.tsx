import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Brain, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Prediction {
  date: string;
  predictedOccupancy: number;
  confidence: number;
  factors: string[];
}

interface PredictionResponse {
  predictions: Prediction[];
  summary: string;
  riskLevel: string;
}

export default function AIPredictionPanel() {
  const [data, setData] = useState<PredictionResponse | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const mutation = trpc.ai.occupancyPrediction.useMutation();

  const handlePredict = async () => {
    try {
      const result = await mutation.mutateAsync({ days: 7, totalRooms: 30 });
      setData(result);
      toast.success("AI occupancy prediction generated");
    } catch {
      toast.error("Failed to generate prediction");
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-2"
      >
        <Brain className="h-4 w-4" />
        AI Occupancy Prediction
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
              <Brain className="h-4 w-4 text-purple-500" />
              AI Occupancy Prediction
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
            onClick={handlePredict}
            disabled={mutation.isPending}
            size="sm"
            className="w-full mb-3"
            variant="outline"
          >
            {mutation.isPending ? (
              <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
            ) : (
              <TrendingUp className="h-3.5 w-3.5 mr-2" />
            )}
            {mutation.isPending ? "Analyzing..." : "Generate Prediction"}
          </Button>

          {data ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <p className="text-xs text-muted-foreground mb-1">Summary</p>
                <p className="text-sm">{data.summary}</p>
              </div>

              <div className="space-y-2">
                {data.predictions.slice(0, 5).map((pred, i) => (
                  <motion.div
                    key={pred.date}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-2 rounded-lg bg-accent/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">
                        {new Date(pred.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <span className="text-xs font-bold text-primary">
                        {pred.predictedOccupancy}%
                      </span>
                    </div>
                    <Progress value={pred.predictedOccupancy} className="h-1.5" />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        Confidence: {pred.confidence}%
                      </span>
                      {pred.factors.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {pred.factors[0]}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <Badge
                variant={
                  data.riskLevel === "low" ? "default" :
                  data.riskLevel === "medium" ? "secondary" : "destructive"
                }
                className="w-full justify-center text-xs"
              >
                Risk Level: {data.riskLevel}
              </Badge>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Brain className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Click to generate AI prediction</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
