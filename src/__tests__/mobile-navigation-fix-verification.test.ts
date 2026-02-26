/**
 * Mobile Navigation Fix Verification Test
 * 
 * This test verifies that the mobile navigation fix is working correctly.
 * It should PASS after the fix is applied.
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MobileHeader from '../components/MobileHeader.vue'

describe('Mobile Navigation Fix Verification', () => {
  it('should render MobileHeader component with hamburger button', () => {
    const wrapper = mount(MobileHeader, {
      global: {
        stubs: {
          'router-link': {
            template: '<a :class="$attrs.class"><slot /></a>',
            props: ['to', 'exactActiveClass', 'activeClass']
          }
        }
      }
    })

    // Verify MobileHeader exists
    expect(wrapper.find('.mobile-header').exists()).toBe(true)

    // Verify hamburger button exists
    const hamburgerButton = wrapper.find('.hamburger-button')
    expect(hamburgerButton.exists()).toBe(true)

    // Verify hamburger has three lines
    const hamburgerLines = wrapper.findAll('.hamburger-line')
    expect(hamburgerLines.length).toBe(3)

    wrapper.unmount()
  })

  it('should toggle menu when hamburger button is clicked', async () => {
    const wrapper = mount(MobileHeader, {
      global: {
        stubs: {
          'router-link': {
            template: '<a :class="$attrs.class"><slot /></a>',
            props: ['to', 'exactActiveClass', 'activeClass']
          }
        }
      }
    })

    // Initially menu should be hidden (v-show sets display: none)
    const nav = wrapper.find('.mobile-nav')
    expect(nav.exists()).toBe(true)
    // Check that v-show is working by checking if element is in DOM but hidden
    expect(nav.element.style.display).toBe('none')

    // Click hamburger button
    await wrapper.find('.hamburger-button').trigger('click')
    await nextTick()

    // Menu should now be visible (v-show removes display: none)
    expect(nav.element.style.display).not.toBe('none')

    // Hamburger button should have 'is-open' class
    expect(wrapper.find('.hamburger-button').classes()).toContain('is-open')

    wrapper.unmount()
  })

  it('should have navigation links in mobile menu', async () => {
    const wrapper = mount(MobileHeader, {
      global: {
        stubs: {
          'router-link': {
            template: '<a :class="$attrs.class"><slot /></a>',
            props: ['to', 'exactActiveClass', 'activeClass']
          }
        }
      }
    })

    // Open menu
    await wrapper.find('.hamburger-button').trigger('click')
    await nextTick()

    // Verify navigation links exist
    const navLinks = wrapper.findAll('.nav-link')
    expect(navLinks.length).toBe(3) // Home, Projects, Resume

    // Verify link text
    expect(navLinks[0].text()).toContain('ГЛАВНАЯ')
    expect(navLinks[1].text()).toContain('ПРОЕКТЫ')
    expect(navLinks[2].text()).toContain('РЕЗЮМЕ')

    wrapper.unmount()
  })

  it('should close menu when clicking overlay', async () => {
    const wrapper = mount(MobileHeader, {
      global: {
        stubs: {
          'router-link': {
            template: '<a :class="$attrs.class"><slot /></a>',
            props: ['to', 'exactActiveClass', 'activeClass']
          }
        }
      }
    })

    const nav = wrapper.find('.mobile-nav')

    // Open menu
    await wrapper.find('.hamburger-button').trigger('click')
    await nextTick()
    expect(nav.element.style.display).not.toBe('none')

    // Click overlay
    await wrapper.find('.mobile-nav-overlay').trigger('click')
    await nextTick()

    // Menu should be closed
    expect(nav.element.style.display).toBe('none')

    wrapper.unmount()
  })

  it('should have proper accessibility attributes', () => {
    const wrapper = mount(MobileHeader, {
      global: {
        stubs: {
          'router-link': {
            template: '<a :class="$attrs.class" :aria-label="$attrs[\'aria-label\']"><slot /></a>',
            props: ['to', 'exactActiveClass', 'activeClass']
          }
        }
      }
    })

    // Verify hamburger button has aria attributes
    const hamburgerButton = wrapper.find('.hamburger-button')
    expect(hamburgerButton.attributes('aria-label')).toBeDefined()
    expect(hamburgerButton.attributes('aria-expanded')).toBeDefined()
    expect(hamburgerButton.attributes('aria-controls')).toBe('mobile-nav')

    // Verify nav has proper role and aria-label
    const nav = wrapper.find('.mobile-nav')
    expect(nav.attributes('role')).toBe('navigation')
    expect(nav.attributes('aria-label')).toBe('Mobile navigation')

    // Verify nav links have aria-label
    const navLinks = wrapper.findAll('.nav-link')
    navLinks.forEach(link => {
      expect(link.attributes('aria-label')).toBeDefined()
    })

    wrapper.unmount()
  })
})
