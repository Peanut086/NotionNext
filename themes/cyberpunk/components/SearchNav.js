import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import { useEffect, useRef } from 'react'
import SearchInput from './SearchInput'

const SearchNav = props => {
  const { tagOptions, categoryOptions } = props
  const cRef = useRef(null)
  const { locale } = useGlobal()

  useEffect(() => {
    cRef?.current?.focus()
  }, [])

  return (
    <div className='py-10'>
      <div className='max-w-2xl mx-auto'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-[#00fff9] cyber-glow-text mb-2'>
            <i className='fas fa-search mr-2' />
            数据检索
          </h1>
          <p className='text-[#888]'>
            在数据流中搜索你需要的信息
          </p>
        </div>

        <div className='p-4 bg-[rgba(10,10,20,0.85)] backdrop-blur-sm border border-[rgba(0,255,249,0.3)] mb-6'>
          <SearchInput cRef={cRef} {...props} />
        </div>

        {categoryOptions && categoryOptions.length > 0 && (
          <div className='p-4 bg-[rgba(10,10,20,0.85)] backdrop-blur-sm border border-[rgba(0,255,249,0.3)] mb-4'>
            <h3 className='text-lg font-bold text-[#00fff9] mb-3'>
              {locale.COMMON.CATEGORY}
            </h3>
            <div className='flex flex-wrap gap-2'>
              {categoryOptions?.map(category => (
                <SmartLink
                  key={category.name}
                  href={`/category/${category.name}`}
                  passHref
                  legacyBehavior>
                  <span className='px-3 py-1 border border-[rgba(0,255,249,0.3)] text-[#00fff9] hover:bg-[#00fff9] hover:text-[#0a0a0f] transition-all duration-300 cursor-pointer text-sm'>
                    {category.name} ({category.count})
                  </span>
                </SmartLink>
              ))}
            </div>
          </div>
        )}

        {tagOptions && tagOptions.length > 0 && (
          <div className='p-4 bg-[rgba(10,10,20,0.85)] backdrop-blur-sm border border-[rgba(255,0,255,0.3)]'>
            <h3 className='text-lg font-bold text-[#ff00ff] mb-3'>
              {locale.COMMON.TAGS}
            </h3>
            <div className='flex flex-wrap gap-2'>
              {tagOptions?.map(tag => (
                <SmartLink
                  key={tag.name}
                  href={`/tag/${tag.name}`}
                  passHref
                  legacyBehavior>
                  <span className='px-3 py-1 border border-[rgba(255,0,255,0.3)] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-[#0a0a0f] transition-all duration-300 cursor-pointer text-sm'>
                    {tag.name} ({tag.count})
                  </span>
                </SmartLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchNav
