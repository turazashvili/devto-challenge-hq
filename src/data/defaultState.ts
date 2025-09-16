import { TrackerState } from "@/types/tracker";

export const defaultState: TrackerState = {
  challenges: [
    {
      id: "spring-community-build",
      title: "Spring Community Health Hackathon",
      theme: "Community, open-source, health-tech alliances",
      status: "Drafting",
      deadline: new Date().toISOString(),
      progress: 38,
      description:
        "Outline an actionable playbook for a health-focused open-source initiative with strong DEV community involvement.",
      tags: ["health", "open-source", "community"],
    },
    {
      id: "ai-mentorship-network",
      title: "AI Mentorship Network",
      theme: "AI education, mentorship, onboarding",
      status: "Ideation",
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
      progress: 12,
      description:
        "Design a mentorship journey for DEV learners exploring AI tools, from discovery to publishing.",
      tags: ["ai", "mentorship", "learning"],
    },
  ],
  tasks: [
    {
      id: "outline-case-studies",
      challengeId: "spring-community-build",
      title: "Outline community case studies",
      status: "In Progress",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
      notes: "Focus on stories with measurable health outcomes.",
    },
    {
      id: "collect-mentor-feedback",
      challengeId: "ai-mentorship-network",
      title: "Collect mentor expectations",
      status: "Not Started",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6).toISOString(),
    },
  ],
  ideas: [
    {
      id: "community-office-hours",
      challengeId: "spring-community-build",
      title: "Community office hours",
      impact: "High Impact",
      notes:
        "Live streaming Q&A with health projects to show the open-source processes and invite contributions.",
      tags: ["stream", "community"],
    },
    {
      id: "ai-learning-sprints",
      title: "AI learning sprints",
      impact: "Quick Win",
      notes:
        "Create 7-day sprint templates combining DEV articles, GitHub repos, and short video explainers.",
      tags: ["ai", "curriculum"],
    },
  ],
  resources: [
    {
      id: "dev-oss-health-guide",
      challengeId: "spring-community-build",
      title: "DEV Guide: Running Health-focused OSS",
      url: "https://dev.to/collection/health-open-source",
      type: "Article",
      notes: "Case studies and partner requirements.",
      tags: ["health", "oss"],
    },
    {
      id: "ai-mentorship-canvas",
      title: "Mentorship Program Canvas",
      url: "https://dev.to/templates/mentorship-canvas",
      type: "Tool",
      notes: "Use for mapping onboarding flows and metrics.",
      tags: ["template", "mentorship"],
    },
  ],
};
