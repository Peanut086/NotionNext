import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'

const RandomPostButton = props => {
  const { locale } = useGlobal()
  const router = useRouter()
  const { posts } = props

  const handleClick = () => {
    if (!posts || posts.length === 0) return
    
    const randomIndex = Math.floor(Math.random() * posts.length)
    const randomPost = posts[randomIndex]
    
    if (randomPost?.slug) {
      router.push(`/${randomPost.slug}`)
    }
  }

  return (
    <div
      onClick={handleClick}
      className='flex items-center justify-center w-8 h-8 cursor-pointer text-[#fcee0a] hover:text-[#ff00ff] transition-colors duration-300'
      title='随机文章'
    >
      <i className='fas fa-random' />
    </div>
  )
}

export default RandomPostButton
