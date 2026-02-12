import { useGlobal } from '@/lib/global'
import { useEffect, useState } from 'react'

const DarkModeButton = props => {
  const { isDarkMode, toggleDarkMode } = useGlobal()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div
      onClick={toggleDarkMode}
      className='flex items-center justify-center w-8 h-8 cursor-pointer text-[#00fff9] hover:text-[#ff00ff] transition-colors duration-300'
      title={isDarkMode ? '切换至日间模式' : '切换至夜间模式'}
    >
      <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`} />
    </div>
  )
}

export default DarkModeButton
