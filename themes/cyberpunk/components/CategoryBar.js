import { siteConfig } from '@/lib/config'
import { useRouter } from 'next/router'
import Link from 'next/link'
import CONFIG from '../config'

const CategoryBar = props => {
  const { categoryOptions, border = true } = props
  const router = useRouter()
  const currentCategory = router.query.category || ''

  if (!categoryOptions || categoryOptions.length === 0) {
    return null
  }

  return (
    <div className={`mb-6 ${border ? 'border-b border-[rgba(0,255,249,0.2)]' : ''} pb-4`}>
      <div className='flex items-center gap-2 overflow-x-auto scroll-hidden py-2'>
        <Link href='/' passHref legacyBehavior>
          <div className={`flex-shrink-0 px-4 py-2 text-sm cursor-pointer transition-all duration-300 border ${
            router.route === '/' 
              ? 'bg-[#00fff9] text-[#0a0a0f] border-[#00fff9] shadow-[0_0_15px_rgba(0,255,249,0.5)]' 
              : 'bg-transparent text-[#e0e0e0] border-[rgba(0,255,249,0.3)] hover:border-[#00fff9] hover:text-[#00fff9]'
          }`}>
            <i className='fas fa-home mr-1' />
            全部
          </div>
        </Link>

        {categoryOptions.map(category => (
          <Link 
            key={category.name} 
            href={`/category/${category.name}`} 
            passHref 
            legacyBehavior>
            <div className={`flex-shrink-0 px-4 py-2 text-sm cursor-pointer transition-all duration-300 border ${
              currentCategory === category.name 
                ? 'bg-[#ff00ff] text-[#0a0a0f] border-[#ff00ff] shadow-[0_0_15px_rgba(255,0,255,0.5)]' 
                : 'bg-transparent text-[#e0e0e0] border-[rgba(255,0,255,0.3)] hover:border-[#ff00ff] hover:text-[#ff00ff]'
            }`}>
              <i className='fas fa-folder mr-1' />
              {category.name}
              <span className='ml-2 text-xs opacity-70'>({category.count})</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default CategoryBar
