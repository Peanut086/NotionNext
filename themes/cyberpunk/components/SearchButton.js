import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'

const SearchButton = props => {
  const { locale } = useGlobal()
  const router = useRouter()

  const handleClick = () => {
    router.push('/search')
  }

  return (
    <div
      onClick={handleClick}
      className='flex items-center justify-center w-8 h-8 cursor-pointer text-[#00fff9] hover:text-[#ff00ff] transition-colors duration-300'
      title='搜索'
    >
      <i className='fas fa-search' />
    </div>
  )
}

export default SearchButton
