import { redirect } from "next/navigation";

interface LegacyConversationPageProps {
  params: Promise<{ serverId: string; memberId: string }>;
}

const LegacyConversationPage = async ({ params }: LegacyConversationPageProps) => {
  const { memberId } = await params;
  redirect(`/dms/${memberId}`);
};

export default LegacyConversationPage;
