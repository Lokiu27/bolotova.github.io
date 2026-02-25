import type { InjectionKey, Ref } from 'vue'
import type { HeroData, AboutData, ContactsData } from './index'

export const heroDataKey: InjectionKey<Ref<HeroData | undefined>> = Symbol('heroData')
export const aboutDataKey: InjectionKey<Ref<AboutData | undefined>> = Symbol('aboutData')
export const contactsDataKey: InjectionKey<Ref<ContactsData | undefined>> = Symbol('contactsData')
