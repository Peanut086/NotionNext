import { siteConfig } from '@/lib/config'
import Link from 'next/link'
import { useRouter } from 'next/router'
import CONFIG from '../config'

export const MenuListSide = props => {
  const { customNav, onClose } = props
  const router = useRouter()

  const CYBERPUNK_MENU_INDEX = siteConfig('CYBERPUNK_MENU_INDEX', true, CONFIG)
  const CYBERPUNK_MENU_CATEGORY = siteConfig('CYBERPUNK_MENU_CATEGORY', true, CONFIG)
  const CYBERPUNK_MENU_TAG = siteConfig('CYBERPUNK_MENU_TAG', true, CONFIG)
  const CYBERPUNK_MENU_ARCHIVE = siteConfig('CYBERPUNK_MENU_ARCHIVE', true, CONFIG)
  const CYBERPUNK_MENU_SEARCH = siteConfig('CYBERPUNK_MENU_SEARCH', true, CONFIG)

  const defaultLinks = [
    CYBERPUNK_MENU_INDEX && { name: '首页', href: '/', icon: 'fas fa-home', show: true },
    CYBERPUNK_MENU_CATEGORY && { name: '分类', href: '/category', icon: 'fas fa-folder', show: true },
    CYBERPUNK_MENU_TAG && { name: '标签', href: '/tag', icon: 'fas fa-tags', show: true },
    CYBERPUNK_MENU_ARCHIVE && { name: '归档', href: '/archive', icon: 'fas fa-archive', show: true },
    CYBERPUNK_MENU_SEARCH && { name: '搜索', href: '/search', icon: 'fas fa-search', show: true }
  ].filter(Boolean)

  let links = defaultLinks

  if (customNav) {
    links = customNav.concat(links)
  }

  const isActive = href => {
    if (href === '/') {
      return router.pathname === '/'
    }
    return router.pathname.startsWith(href)
  }

  return (
    <nav className='space-y-2'>
      {links?.map((link, index) => (
        <Link key={index} href={link.href} passHref legacyBehavior>
          <div
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-300 border ${
              isActive(link.href)
                ? 'bg-[rgba(0,255,249,0.1)] text-[#00fff9] border-[rgba(0,255,249,0.5)]'
                : 'text-[#e0e0e0] border-transparent hover:border-[rgba(0,255,249,0.3)] hover:text-[#00fff9]'
            }`}
          >
            <i className={`${link.icon} w-5 text-center`} />
            <span>{link.name}</span>
            {isActive(link.href) && (
              <span className='ml-auto text-[#ff00ff]'>
                <i className='fas fa-chevron-right' />
              </span>
            )}
          </div>
        </Link>
      ))}
    </nav>
  )
}

export default MenuListSide
