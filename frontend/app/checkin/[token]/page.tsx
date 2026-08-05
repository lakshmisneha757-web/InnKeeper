import { WelcomeScreen } from "@/components/checkin/WelcomeScreen";

export default function Page({ params }: { params: { token: string } }) {
  return <WelcomeScreen token={params.token} />;
}
