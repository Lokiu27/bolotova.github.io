export interface HeroData {
  title: string;
  subtitle: string;
  description: string;
  profile_image: string;
  role?: string;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface AboutData {
  title: string;
  description: string;
  features: Feature[];
}

export interface ContactsData {
  email: string;
  telegram: string;
  github: string;
  resume: string;
}
