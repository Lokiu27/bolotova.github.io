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

// Export validation functions
export const validateHeroData = (data: unknown) => HeroDataSchema.parse(data)
export const validateAboutData = (data: unknown) => AboutDataSchema.parse(data)
export const validateContactsData = (data: unknown) => ContactsDataSchema.parse(data)
