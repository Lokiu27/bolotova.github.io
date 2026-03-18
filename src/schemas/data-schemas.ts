import { z } from 'zod'

// Zod schema for Feature
const FeatureSchema = z.object({
  icon: z.string().min(1, 'Icon is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required')
})

// Zod schema for HeroData
export const HeroDataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().min(1, 'Subtitle is required'),
  description: z.string().min(1, 'Description is required'),
  profile_image: z.string().min(1, 'Profile image is required'),
  role: z.string().optional()
})

// Zod schema for AboutData
export const AboutDataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  features: z.array(FeatureSchema).min(1, 'At least one feature is required')
})

// Zod schema for ContactsData
export const ContactsDataSchema = z.object({
  email: z.string().email('Invalid email format'),
  telegram: z.string().min(1, 'Telegram is required'),
  github: z.string().min(1, 'GitHub is required'),
  resume: z.string().optional()
})

// Zod schemas for HomepageBlocks
const ChallengesSchema = z.object({
  label: z.string().min(1),
  title: z.string().min(1),
  intro: z.string().optional(),
  items: z.array(z.string().min(1)).min(1)
})

const ApproachSchema = z.object({
  label: z.string().min(1),
  title: z.string().optional(),
  intro: z.string().optional(),
  items: z.array(z.string().min(1)).min(1),
  goal: z.string().min(1)
})

const FormatItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1)
})

const FormatsSchema = z.object({
  label: z.string().min(1),
  title: z.string().optional(),
  items: z.array(FormatItemSchema).min(1)
})

const AboutMeSchema = z.object({
  label: z.string().min(1),
  role: z.string().min(1),
  specializations: z.array(z.string().min(1)).min(1),
  summary: z.string().min(1)
})

const CtaSchema = z.object({
  label: z.string().min(1),
  situations: z.string().min(1),
  callToAction: z.string().min(1),
  buttonText: z.string().min(1)
})

export const HomepageBlocksSchema = z.object({
  challenges: ChallengesSchema.optional(),
  approach: ApproachSchema.optional(),
  formats: FormatsSchema.optional(),
  aboutMe: AboutMeSchema.optional(),
  cta: CtaSchema.optional()
})

// Export validation functions
export const validateHeroData = (data: unknown) => HeroDataSchema.parse(data)
export const validateAboutData = (data: unknown) => AboutDataSchema.parse(data)
export const validateContactsData = (data: unknown) => ContactsDataSchema.parse(data)
export const validateHomepageBlocksData = (data: unknown) => HomepageBlocksSchema.parse(data)
