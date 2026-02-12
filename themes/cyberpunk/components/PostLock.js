import { useState } from 'react'
import { useGlobal } from '@/lib/global'

export const PostLock = props => {
  const { validPassword } = props
  const { locale } = useGlobal()
  
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = e => {
    e.preventDefault()
    if (validPassword(password)) {
      setError(false)
    } else {
      setError(true)
    }
  }

  return (
    <div className='flex items-center justify-center min-h-[60vh]'>
      <div className='w-full max-w-md p-6 bg-[rgba(10,10,20,0.95)] backdrop-blur-md border border-[rgba(0,255,249,0.3)] relative overflow-hidden'>
        <style jsx>{`
          @keyframes lock-pulse {
            0%, 100% {
              box-shadow: 0 0 20px rgba(0, 255, 249, 0.3);
            }
            50% {
              box-shadow: 0 0 40px rgba(0, 255, 249, 0.6);
            }
          }
        `}</style>

        <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00fff9] via-[#ff00ff] to-[#fcee0a]' />

        <div className='text-center mb-6'>
          <div className='w-16 h-16 mx-auto mb-4 border-2 border-[#00fff9] flex items-center justify-center' style={{ animation: 'lock-pulse 2s ease-in-out infinite' }}>
            <i className='fas fa-lock text-2xl text-[#00fff9]' />
          </div>
          <h2 className='text-xl font-bold text-[#00fff9] cyber-glow-text'>
            内容已加密
          </h2>
          <p className='text-sm text-[#888] mt-2'>
            请输入访问密码以查看内容
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='relative'>
            <input
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder='输入密码'
              className='w-full px-4 py-3 bg-[rgba(0,0,0,0.5)] border border-[rgba(0,255,249,0.3)] text-[#e0e0e0] focus:border-[#00fff9] focus:outline-none transition-colors duration-300'
            />
            <i className='fas fa-key absolute right-4 top-1/2 -translate-y-1/2 text-[#888]' />
          </div>

          {error && (
            <div className='text-sm text-[#ff2a6d] flex items-center gap-2'>
              <i className='fas fa-exclamation-triangle' />
              密码错误，请重试
            </div>
          )}

          <button
            type='submit'
            className='w-full py-3 bg-[rgba(0,255,249,0.1)] border border-[#00fff9] text-[#00fff9] hover:bg-[#00fff9] hover:text-[#0a0a0f] transition-all duration-300 font-bold tracking-wider'
          >
            解锁内容
          </button>
        </form>
      </div>
    </div>
  )
}

export default PostLock
