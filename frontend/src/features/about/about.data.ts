import { contactData } from '../../data/contact.data';

/* ── Hero / profile ── */
export interface ProfileData {
  name: string;
  fullName: string;
  title: string;
  email: string;
  location: string;
  profileImage: string;
  tagline: string;
  objective: string;
}

export const profileData: ProfileData = {
  name: contactData.name,
  fullName: contactData.fullName,
  title: "Computer Science Bachelor",
  email: contactData.email,
  location: contactData.location,
  profileImage: "/me3.jpeg",
  tagline: "Machine Learning • Computer Vision • Data Science",
  objective:
    "I design intelligent systems combining Machine Learning, Computer Vision and Software Engineering — built for efficiency, clarity and scale.",
};

/* ── Technical focus ── */
export interface ProjectCategory {
  title: string;
  description: string;
  points: string[];
  tech: string[];
}

export interface TechnicalFocusData {
  softwareSystems: ProjectCategory;
  machineLearning: ProjectCategory;
  algorithms: ProjectCategory;
}

export const technicalFocusData: TechnicalFocusData = {
  softwareSystems: {
    title: "Software Systems and Database Engineering",
    description: "Backend architecture and data modeling for systems that need to stay correct under real load.",
    points: [
      "Designed and implemented backend-oriented systems with modular architecture and relational database integration.",
      "Defined data models, relationships, and constraints, focusing on consistency, integrity, and efficient querying.",
      "Applied engineering principles to ensure maintainability and scalability.",
    ],
    tech: ["C#", ".NET", "SQL", "Docker"],
  },
  machineLearning: {
    title: "Machine Learning and Data Analysis",
    description: "End-to-end ML pipelines, from raw data to validated, interpretable models.",
    points: [
      "Implemented a complete machine learning pipeline: cleaning, feature engineering, EDA, PCA, and preprocessing.",
      "Trained and evaluated supervised and unsupervised models based on data characteristics.",
      "Validated results using precision, recall, and confusion matrices.",
    ],
    tech: ["Python", "PyTorch", "Pandas", "scikit-learn"],
  },
  algorithms: {
    title: "Algorithms and Performance Analysis",
    description: "Core data structures and algorithms, implemented and analyzed from first principles.",
    points: [
      "Implemented fundamental data structures and algorithms from scratch (graphs, sorting, shortest-path).",
      "Analyzed time and space complexity to compare performance trade-offs.",
    ],
    tech: ["C++", "Java"],
  },
};

/* ── Experience ── */
export interface ExperienceEntry {
  role: string;
  company: string;
  period: string;
  badges: string[];
  description: string[];
}

export const experienceData: ExperienceEntry[] = [
  {
    role: "Software and AI Projects",
    company: "Independent/Lab",
    period: "2023 — Current",
    badges: ["Research", "AI", "Mobile"],
    description: [
      "Developed and published an Android application for academic and social-impact use.",
      "Optimized neural network implementations in C++ using CPU-level parallelism.",
      "Built biologically inspired simulations modeling plant growth through hierarchical data structures.",
    ],
  },
  {
    role: "Technical Advisor",
    company: "University of Costa Rica",
    period: "2024 — Ongoing",
    badges: ["Backend", "DevOps"],
    description: [
      "Provided technical support for institutional systems, databases, and server infrastructure in medical environments.",
      "Assisted with system maintenance, troubleshooting, and inter-device communication.",
    ],
  },
];

/* ── Education ── */
export interface EducationData {
  university: string;
  faculty: string;
  degree: string;
  gpa: string;
  expected: string;
  duration: string;
  universityLogo?: string;
  facultyImage?: string;
  coursework: string[];
}

export const educationData: EducationData = {
  university: "University of Costa Rica (UCR)",
  faculty: "School of Computer Science and Informatics (ECCI)",
  degree: "B.Sc. in Computer Science",
  gpa: "9.4 / 10",
  expected: "August 2026",
  duration: "2022 – 2026",
  universityLogo: "/ucr_logo.png",
  facultyImage: "/ecci.png",
  coursework: [
    "Data Structures and Algorithms",
    "Software Engineering",
    "Databases",
    "Computer Architecture",
    "Artificial Intelligence",
    "Machine Learning",
    "Linear Algebra",
    "Probability and Statistics",
  ],
};

/* ── Skills ── */
export type SkillLevel = "Advanced" | "Intermediate";
export type SkillCategory = "Languages" | "Frameworks" | "Cloud & Tools" | "AI & Data";

export interface SkillItem {
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  years: number;
  logo?: string;
}

const devicon = (slug: string) =>
  `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${slug}-original.svg`;

export const skillsData: SkillItem[] = [
  // Languages
  { name: "C", category: "Languages", level: "Advanced", years: 4, logo: devicon("c/c") },
  { name: "C++", category: "Languages", level: "Advanced", years: 4, logo: devicon("cplusplus/cplusplus") },
  { name: "C#", category: "Languages", level: "Intermediate", years: 2, logo: devicon("csharp/csharp") },
  { name: "Python", category: "Languages", level: "Advanced", years: 4, logo: devicon("python/python") },
  { name: "Java", category: "Languages", level: "Intermediate", years: 3, logo: devicon("java/java") },
  { name: "JavaScript", category: "Languages", level: "Intermediate", years: 2, logo: devicon("javascript/javascript") },
  { name: "Kotlin", category: "Languages", level: "Intermediate", years: 1, logo: devicon("kotlin/kotlin") },
  { name: "MATLAB", category: "Languages", level: "Intermediate", years: 2, logo: devicon("matlab/matlab") },
  { name: "R", category: "Languages", level: "Intermediate", years: 1, logo: devicon("r/r") },
  { name: "HTML 5", category: "Languages", level: "Advanced", years: 3, logo: devicon("html5/html5") },
  { name: "CSS 3", category: "Languages", level: "Intermediate", years: 3, logo: devicon("css3/css3") },
  // Frameworks
  { name: ".NET", category: "Frameworks", level: "Intermediate", years: 2, logo: devicon("dot-net/dot-net") },
  // AI & Data
  { name: "Jupyter notebook", category: "AI & Data", level: "Advanced", years: 3, logo: devicon("jupyter/jupyter") },
  { name: "Anaconda", category: "AI & Data", level: "Advanced", years: 3, logo: devicon("anaconda/anaconda") },
  { name: "SQL", category: "AI & Data", level: "Advanced", years: 3, logo: devicon("mysql/mysql") },
  // Cloud & Tools
  { name: "Visual Studio", category: "Cloud & Tools", level: "Advanced", years: 4, logo: devicon("visualstudio/visualstudio") },
  { name: "Android Studio", category: "Cloud & Tools", level: "Intermediate", years: 2, logo: devicon("androidstudio/androidstudio") },
  { name: "Linux", category: "Cloud & Tools", level: "Advanced", years: 4, logo: devicon("linux/linux") },
];

export const skillCategories: SkillCategory[] = ["Languages", "Frameworks", "AI & Data", "Cloud & Tools"];

/* ── Metrics strip ── */
export interface MetricItem {
  value: string;
  label: string;
}

export const metricsData: MetricItem[] = [
  { value: "20+", label: "Projects" },
  { value: "4", label: "Years Programming" },
  { value: "10+", label: "Languages" },
  { value: "2", label: "Research Projects" },
];

/* ── Research interests ── */
export const researchInterests: string[] = [
  "Machine Learning & Computer Vision",
  "Distributed & Real-time Systems",
  "Algorithmic Optimization",
  "Human-centered AI",
];

/* ── Featured project ── */
export interface FeaturedProjectData {
  label: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
}

export const featuredProjectData: FeaturedProjectData = {
  label: "Featured Project",
  title: "Multiplayer Pac-Man",
  description:
    "High-performance multiplayer infrastructure using custom WebSocket protocols and C++ core optimization. Real-time synchronization of game states across multiple concurrent clients.",
  image: "/assets/projects/pacman.png",
  tags: ["C++", "WebSockets", "Networking", "Real-time"],
};
