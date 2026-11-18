import type { Metadata } from "next";
import DocsShell from "@/components/docs/DocsShell";

export const metadata: Metadata = {
  title: { default: "Holorra Docs", template: "%s · Holorra Docs" },
  description:
    "How Holorra works: Gaussian Splatting worlds, Lux3D part split, articulation and rigging, play mode, the camera director, Aholo MCP and the /api/aholo routes.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsShell>{children}</DocsShell>;
}
