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

export interface ChallengesData {
  label: string
  title: string
  intro?: string
  items: string[]
}

export interface ApproachData {
  label: string
  title?: string
  intro?: string
  items: string[]
  goal: string
}

export interface FormatItem {
  title: string
  description: string
}

export interface FormatsData {
  label: string
  title?: string
  items: FormatItem[]
}

export interface AboutMeData {
  label: string
  role: string
  specializations: string[]
  summary: string
}

export interface CtaData {
  label: string
  situations: string
  callToAction: string
  buttonText: string
}

export interface HomepageBlocksData {
  challenges?: ChallengesData
  approach?: ApproachData
  formats?: FormatsData
  aboutMe?: AboutMeData
  cta?: CtaData
}
