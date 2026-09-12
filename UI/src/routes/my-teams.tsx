import { createFileRoute } from "@tanstack/react-router";
import { MyTeamsView } from "@/components/fc/MyTeamsView";

export const Route = createFileRoute("/my-teams")({
  head: () => ({
    meta: [
      { title: "My Teams — Fantasy Cricket" },
      { name: "description", content: "View and manage your created fantasy cricket lineups, pitch squad previews, and captain selections." },
    ],
  }),
  component: MyTeamsView,
});

