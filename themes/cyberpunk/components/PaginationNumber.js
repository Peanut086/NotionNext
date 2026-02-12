import { siteConfig } from '@/lib/config'
import Link from 'next/link'
import { useRouter } from 'next/router'
import CONFIG from '../config'

const PaginationNumber = props => {
  const { page, currentPage } = props
  const router = useRouter()

  if (!page || page.totalPages <= 1) {
    return null
  }

  const currentPageNumber = currentPage || page.currentPage
  const totalPages = page.totalPages
  const pages = []

  for (let i = 1; i <= totalPages; i++) {
    pages.push(i)
  }

  const buildUrl = pageNum => {
    const query = { ...router.query, page: pageNum }
    return { pathname: router.pathname, query }
  }

  return (
    <div className='flex justify-center items-center gap-2 mt-10 mb-6'>
      {currentPageNumber > 1 && (
        <Link href={buildUrl(currentPageNumber - 1)} passHref legacyBehavior>
          <div className='cyber-button text-sm py-2 px-4'>
            <i className='fas fa-chevron-left mr-1' />
            上一页
          </div>
        </Link>
      )}

      <div className='flex items-center gap-1'>
        {pages.map(p => (
          <Link key={p} href={buildUrl(p)} passHref legacyBehavior>
            <div className={`w-10 h-10 flex items-center justify-center cursor-pointer transition-all duration-300 border ${
              p === currentPageNumber 
                ? 'bg-[#00fff9] text-[#0a0a0f] border-[#00fff9] shadow-[0_0_15px_rgba(0,255,249,0.5)] font-bold' 
                : 'bg-transparent text-[#e0e0e0] border-[rgba(0,255,249,0.3)] hover:border-[#00fff9] hover:text-[#00fff9]'
            }`}>
              {p}
            </div>
          </Link>
        ))}
      </div>

      {currentPageNumber < totalPages && (
        <Link href={buildUrl(currentPageNumber + 1)} passHref legacyBehavior>
          <div className='cyber-button cyber-button-pink text-sm py-2 px-4'>
            下一页
            <i className='fas fa-chevron-right ml-1' />
          </div>
        </Link>
      )}
    </div>
  )
}

export default PaginationNumber
