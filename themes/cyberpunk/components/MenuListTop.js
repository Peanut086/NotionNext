import { siteConfig } from '@/lib/config'
import CONFIG from '../config'

export const MenuListTop = props => {
  const { customNav, customMenu } = props

  const CYBERPUNK_MENU_INDEX = siteConfig('CYBERPUNK_MENU_INDEX', true, CONFIG)
  const CYBERPUNK_MENU_CATEGORY = siteConfig('CYBERPUNK_MENU_CATEGORY', true, CONFIG)
  const CYBERPUNK_MENU_TAG = siteConfig('CYBERPUNK_MENU_TAG', true, CONFIG)
  const CYBERPUNK_MENU_ARCHIVE = siteConfig('CYBERPUNK_MENU_ARCHIVE', true, CONFIG)
  const CYBERPUNK_MENU_SEARCH = siteConfig('CYBERPUNK_MENU_SEARCH', true, CONFIG)

  const defaultLinks = [
    CYBERPUNK_MENU_INDEX && { name: '首页', href: '/', show: true },
    CYBERPUNK_MENU_CATEGORY && { name: '分类', href: '/category', show: true },
    CYBERPUNK_MENU_TAG && { name: '标签', href: '/tag', show: true },
    CYBERPUNK_MENU_ARCHIVE && { name: '归档', href: '/archive', show: true },
    CYBERPUNK_MENU_SEARCH && { name: '搜索', href: '/search', show: true }
  ].filter(Boolean)

  let links = defaultLinks

  if (customNav) {
    links = customNav.concat(links)
  }

  return (
    <nav className='flex items-center space-x-1'>
      {links?.map((link, index) => (
        <MenuItemDrop key={index} link={link} />
      ))}
    </nav>
  )
}

const MenuItemDrop = ({ link }) => {
  if (!link || !link.show) {
    return null
  }

  return (
    <div className='relative group'>
      <a
        href={link.href}
        className='px-4 py-2 text-sm font-medium text-[#e0e0e0] hover:text-[#00fff9] transition-all duration-200 relative group'>
        <span className='cyber-underline'>{link.name}</span>
        <style jsx>{`
          .cyber-underline {
            position: relative;
          }

          .cyber-underline::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 0;
            height: 1px;
            background: linear-gradient(90deg, #00fff9, #ff00ff);
            transition: width 0.3s ease;
          }

          .group:hover .cyber-underline::after {
            width: 100%;
          }
        `}</style>
      </a>
    </div>
  )
}

export default MenuListTop
