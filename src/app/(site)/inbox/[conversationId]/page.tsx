// import { prisma } from "@/lib/prisma";
// import ChatBox from "@/components/inbox/ChatBox";
// import { CurrentUserId } from "@/lib/currentUser";

// export default async function ConversationPage({
//   params,
// }: {
//   params: { conversationId: string };
// }) {
//   const userId = await CurrentUserId();
//   if (!userId) return null;

//   const conversation = await prisma.conversation.findFirst({
//     where: {
//       id: params.conversationId,
//       members: { some: { userId } },
//     },
//     include: {
//       messages: {
//         orderBy: { createdAt: "asc" },
//       },
//     },
//   });

//   if (!conversation) return null;

//   return (
//     <ChatBox
//       conversationId={conversation.id}
//       header={{
//         title: conversation.subject ?? "Support",
//         subtitle: "Support Agent",
//         status: "online",
//       }}
//       initialMessages={conversation.messages.map((m) => ({
//         id: m.id,
//         conversationId: m.conversationId,
//         senderType: m.senderType,
//         content: m.content,
//         createdAt: m.createdAt.toISOString(),
//       }))}
//     />
//   );
// }
