import { useRouter } from 'next/router'
import { useImperativeHandle, useRef, useState } from 'react'
import { useGlobal } from '@/lib/global'

let lock = false

const SearchInput = props => {
  const { currentSearch, cRef, className } = props
  const [onLoading, setLoadingState] = useState(false)
  const router = useRouter()
  const searchInputRef = useRef()
  const { locale } = useGlobal()

  useImperativeHandle(cRef, () => {
    return {
      focus: () => {
        searchInputRef?.current?.focus()
      }
    }
  })

  const handleSearch = () => {
    const key = searchInputRef.current.value
    if (key && key !== '') {
      setLoadingState(true)
      router.push({ pathname: '/search/' + key }).then(r => {
        setLoadingState(false)
      })
    } else {
      router.push({ pathname: '/' }).then(r => {})
    }
  }

  const handleKeyUp = e => {
    if (e.keyCode === 13) {
      handleSearch(searchInputRef.current.value)
    } else if (e.keyCode === 27) {
      cleanSearch()
    }
  }

  const cleanSearch = () => {
    searchInputRef.current.value = ''
  }

  const [showClean, setShowClean] = useState(false)
  const updateSearchKey = val => {
    if (lock) {
      return
    }
    searchInputRef.current.value = val
    if (val) {
      setShowClean(true)
    } else {
      setShowClean(false)
    }
  }

  function lockSearchInput() {
    lock = true
  }

  function unLockSearchInput() {
    lock = false
  }

  return (
    <div className={'flex w-full ' + className}>
      <input
        ref={searchInputRef}
        type='text'
        className='outline-none w-full text-sm px-5 py-3 bg-[rgba(0,0,0,0.5)] border border-[rgba(0,255,249,0.3)] text-[#e0e0e0] focus:border-[#00fff9] transition-all duration-300'
        onKeyUp={handleKeyUp}
        onCompositionStart={lockSearchInput}
        onCompositionUpdate={lockSearchInput}
        onCompositionEnd={unLockSearchInput}
        placeholder={locale?.SEARCH?.ARTICLES || '搜索文章...'}
        onChange={e => updateSearchKey(e.target.value)}
        defaultValue={currentSearch || ''}
      />

      <div
        className='-ml-10 cursor-pointer float-right items-center justify-center py-3 px-2'
        onClick={handleSearch}
      >
        <i
          className={`hover:text-[#ff00ff] transform duration-200 text-[#00fff9] cursor-pointer fas ${
            onLoading ? 'fa-spinner animate-spin' : 'fa-search'
          }`}
        />
      </div>

      {showClean && (
        <div className='-ml-16 cursor-pointer float-right items-center justify-center py-3 px-2'>
          <i
            className='hover:text-[#ff00ff] transform duration-200 text-[#888] cursor-pointer fas fa-times'
            onClick={cleanSearch}
          />
        </div>
      )}
    </div>
  )
}

export default SearchInput
