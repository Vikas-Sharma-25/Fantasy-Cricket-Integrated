import { createFileRoute } from "@tanstack/react-router";
import { MyTeamsView } from "@/components/fc/MyTeamsView";

export const Route = createFileRoute("/create-team")({
  head: () => ({
    meta: [
      { title: "Create & Manage Teams — Fantasy Cricket" },
      { name: "description", content: "Build your dream XI, manage lineups, and review captain selections." },
    ],
  }),
  component: MyTeamsView,
});