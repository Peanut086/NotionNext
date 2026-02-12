import { useEffect, useState } from 'react'

const ReadingProgress = () => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setProgress(progress)
    }

    window.addEventListener('scroll', updateProgress)
    updateProgress()

    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  return (
    <div className='fixed top-0 left-0 right-0 h-0.5 z-50 bg-transparent'>
      <div 
        className='h-full bg-gradient-to-r from-[#00fff9] via-[#ff00ff] to-[#fcee0a] transition-all duration-150'
        style={{ width: `${progress}%`, boxShadow: '0 0 10px #00fff9' }}
      />
    </div>
  )
}

export default ReadingProgress
