import { useState, useRef, useEffect } from 'react'
import classNames from '@/utils/classNames'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import ScrollBar from '@/components/ui/ScrollBar'
import navigationIcon from '@/configs/navigation-icon.config'
import { apiGetSearchResult } from '@/services/CommonService'
import debounce from 'lodash/debounce'
import { HiOutlineSearch, HiChevronRight } from 'react-icons/hi'
import { PiMagnifyingGlassDuotone } from 'react-icons/pi'
import { Link, useLocation } from 'react-router'
import Highlighter from 'react-highlight-words'

type SearchData = {
    key: string
    path: string
    title: string
    icon: string
    category: string
    categoryTitle: string
}

type SearchResult = {
    title: string
    data: SearchData[]
}

const recommendedSearch: SearchResult[] = [
    {
        title: 'Recommended',
        data: [],
    },
]

const ListItem = (props: {
    icon: string
    label: string
    url: string
    isLast?: boolean
    keyWord: string
    onNavigate: () => void
}) => {
    const { icon, label, url = '', keyWord, onNavigate } = props

    return (
        <Link to={url} onClick={onNavigate}>
            <div
                className={classNames(
                    'flex items-center justify-between rounded-xl p-3 cursor-pointer user-select',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                )}
            >
                <div className="flex items-center gap-2">
                    <div
                        className={classNames(
                            'rounded-lg border-2 border-gray-200 shadow-xs text-xl group-hover:shadow-sm h-10 w-10 flex items-center justify-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
                        )}
                    >
                        {icon && navigationIcon[icon]}
                    </div>
                    <div className="text-gray-900 dark:text-gray-300">
                        <Highlighter
                            autoEscape
                            highlightClassName={classNames(
                                'text-primary',
                                'underline bg-transparent font-semibold dark:text-white',
                            )}
                            searchWords={[keyWord]}
                            textToHighlight={label}
                        />
                    </div>
                </div>
                <HiChevronRight className="text-lg" />
            </div>
        </Link>
    )
}

const searchPageContent = (query: string): SearchResult => {
    const queryLower = query.toLowerCase()
    const results: SearchData[] = []
    const pageContainer = document.querySelector('[data-loc*="PageContainer"]') || document.querySelector('main')

    if (!pageContainer) {
        return { title: 'Page Content', data: [] }
    }

    const walkDOM = (node: Node, path: string = '') => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || ''
            if (text.toLowerCase().includes(queryLower) && text.trim().length > 0) {
                const parentElement = node.parentElement
                if (parentElement && text.length < 100) {
                    const key = `${path}-${text.substring(0, 30)}`
                    if (!results.some(r => r.key === key)) {
                        results.push({
                            key,
                            path: '#',
                            title: text.trim(),
                            icon: 'document',
                            category: 'Page Content',
                            categoryTitle: 'Page Content',
                        })
                    }
                }
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            Array.from(element.childNodes).forEach((child, index) => {
                walkDOM(child, `${path}/${element.tagName}[${index}]`)
            })
        }
    }

    walkDOM(pageContainer)
    return { title: 'Page Content', data: results.slice(0, 10) }
}

const _Search = ({ className }: { className?: string }) => {
    const location = useLocation()
    const [searchDialogOpen, setSearchDialogOpen] = useState(false)
    const [searchResult, setSearchResult] =
        useState<SearchResult[]>(recommendedSearch)
    const [noResult, setNoResult] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const inputRef = useRef<HTMLInputElement>(null)
    const isOnCandidatesPage = location.pathname === '/candidates'

    const handleReset = () => {
        setNoResult(false)
        setSearchResult(recommendedSearch)
        setSearchQuery('')
    }

    const handleSearchOpen = () => {
        if (isOnCandidatesPage) {
            const candidatesInput = document.querySelector(
                'input[placeholder="Quick search..."]'
            ) as HTMLInputElement
            if (candidatesInput) {
                candidatesInput.focus()
                return
            }
        }
        setSearchDialogOpen(true)
    }

    const handleSearchClose = () => {
        setSearchDialogOpen(false)
        handleReset()
    }

    const debounceFn = debounce(handleDebounceFn, 200)

    async function handleDebounceFn(query: string) {
        if (!query) {
            setSearchResult(recommendedSearch)
            return
        }

        if (noResult) {
            setNoResult(false)
        }

        const respond = await apiGetSearchResult<SearchResult[]>({ query })

        const panelResults = searchPageContent(query)
        const combinedResults = [
            ...respond,
            ...(panelResults.length > 0 ? [panelResults] : []),
        ]

        if (combinedResults.length === 0) {
            setNoResult(true)
        }
        setSearchResult(combinedResults)
    }

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchQuery(value)
        debounceFn(value)
    }

    useEffect(() => {
        if (searchDialogOpen) {
            const timeout = setTimeout(() => inputRef.current?.focus(), 100)
            return () => {
                clearTimeout(timeout)
            }
        }
    }, [searchDialogOpen])

    const handleNavigate = () => {
        handleSearchClose()
    }

    return (
        <>
            <div
                className={classNames(className, 'text-2xl')}
                onClick={handleSearchOpen}
            >
                <PiMagnifyingGlassDuotone />
            </div>
            <Dialog
                contentClassName="p-0"
                isOpen={searchDialogOpen}
                closable={false}
                onRequestClose={handleSearchClose}
            >
                <div>
                    <div className="px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center">
                            <HiOutlineSearch className="text-xl" />
                            <input
                                ref={inputRef}
                                className="ring-0 outline-hidden block w-full p-4 text-base bg-transparent text-gray-900 dark:text-gray-100"
                                placeholder="Search..."
                                onChange={handleSearch}
                            />
                        </div>
                        <Button size="xs" onClick={handleSearchClose}>
                            Esc
                        </Button>
                    </div>
                    <div className="py-6 px-5">
                        <ScrollBar className=" max-h-[350px] overflow-y-auto">
                            {searchResult.map((result) => (
                                <div key={result.title} className="mb-4">
                                    <h6 className="mb-3">{result.title}</h6>
                                    {result.data.map((data, index) => (
                                        <ListItem
                                            key={data.title + index}
                                            icon={data.icon}
                                            label={data.title}
                                            url={data.path}
                                            keyWord={
                                                inputRef.current?.value || ''
                                            }
                                            onNavigate={handleNavigate}
                                        />
                                    ))}
                                </div>
                            ))}
                            {searchResult.length === 0 && noResult && (
                                <div className="my-10 text-center text-lg">
                                    <span>No results for </span>
                                    <span className="heading-text">
                                        {`'`}
                                        {inputRef.current?.value}
                                        {`'`}
                                    </span>
                                </div>
                            )}
                        </ScrollBar>
                    </div>
                </div>
            </Dialog>
        </>
    )
}

const Search = withHeaderItem(_Search)

export default Search
