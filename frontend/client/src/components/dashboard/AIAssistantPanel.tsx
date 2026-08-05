import { useState } from "react";
import { motion } from "framer-motion";
import { AIChatBox } from "@/components/AIChatBox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ChatResponse {
  reply: string;
  action: string;
  entities: {
    roomNumber: string | null;
    guestName: string | null;
    checkIn: string | null;
    checkOut: string | null;
    roomType: string | null;
  };
  suggestions: string[];
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export default function AIAssistantPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const chatMutation = trpc.ai.chat.useMutation();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: `You are InnKeeper AI, a friendly front desk assistant for a hotel property management system. You can help with:
- Checking room availability
- Looking up guest information
- Explaining hotel policies
- Suggesting room upgrades
- Handling guest requests
- Providing local area recommendations

Be concise, professional, and helpful. When you don't know something, say so honestly.
Always respond with structured JSON including: reply (your text response), action (one of: inform, lookup_guest, lookup_room, check_availability, suggest_upgrade, local_recommendation, policy_explanation, escalate), entities (roomNumber, guestName, checkIn, checkOut, roomType - any can be null), suggestions (array of follow-up action suggestions).`,
    },
    {
      role: "assistant",
      content: "Hi! I'm InnKeeper AI, your front desk assistant. I can help with guest check-ins, room assignments, charges, and answer any questions about your property. What can I help you with today?",
    },
  ]);

  const handleSend = async (message: string) => {
    const userMessage: Message = { role: "user", content: message };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const result = await chatMutation.mutateAsync({
        messages: newMessages,
      });
      const response = result as ChatResponse;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.reply },
      ]);
    } catch {
      toast.error("Failed to get AI response");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again." },
      ]);
    }
  };

  if (!isOpen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        >
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] bg-card border rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">AI Front Desk Assistant</h3>
            <p className="text-xs text-muted-foreground">Always online</p>
          </div>
          <Badge variant="outline" className="text-[10px]">Beta</Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="h-[350px]">
        <AIChatBox
          messages={messages}
          onSendMessage={handleSend}
          isLoading={chatMutation.isPending}
        />
      </div>
    </motion.div>
  );
}
