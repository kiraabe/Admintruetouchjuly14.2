import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Dialog from '@/components/ui/Dialog'
import Pagination from '@/components/ui/Pagination'
import { toast } from 'sonner'
import { useAuth } from '@/auth'

type BlogStatus = 'draft' | 'published' | 'archived'

type Blog = {
  id: string
  slug: string
  title_en: string
  excerpt_en: string | null
  body_en: string
  featured_image: string | null
  author_name: string | null
  author_avatar: string | null
  author_role_en: string | null
  author_bio_en: string | null
  publish_date: string | null
  reading_time: string | null
  tags: string[]
  pull_quote_en: string | null
  pull_quote_author: string | null
  status: BlogStatus
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  canonical_url: string | null
  og_image: string | null
  previous_post_slug: string | null
  next_post_slug: string | null
  view_count: number
  created_by: string | null
}

type BlogForm = {
  title_en: string
  excerpt_en: string
  body_en: string
  featured_image: string
  author_name: string
  author_avatar: string
  author_role_en: string
  author_bio_en: string
  tags: string
  pull_quote_en: string
  pull_quote_author: string
  status: BlogStatus
  meta_title: string
  meta_description: string
  meta_keywords: string
  canonical_url: string
  og_image: string
  previous_post_slug: string
  next_post_slug: string
}

const emptyForm: BlogForm = {
  title_en: '', excerpt_en: '', body_en: '', featured_image: '',
  author_name: '', author_avatar: '', author_role_en: '', author_bio_en: '',
  tags: '', pull_quote_en: '', pull_quote_author: '', status: 'draft',
  meta_title: '', meta_description: '', meta_keywords: '', canonical_url: '', og_image: '',
  previous_post_slug: '', next_post_slug: '',
}

const formatDateTime = (value: string | null) => value ? new Date(value).toLocaleString() : 'Not scheduled'
const getTodayDateTime = () => {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16)
}

interface FieldProps {
  label: string
  type?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
}

const Field = ({ label, type = 'text', placeholder, value, onChange }: FieldProps) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
    <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
  </label>
)

interface TextAreaProps {
  label: string
  rows?: number
  placeholder?: string
  value: string
  onChange: (value: string) => void
}

const TextArea = ({ label, rows = 3, placeholder, value, onChange }: TextAreaProps) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
    <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
  </label>
)

const Blog = () => {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalBlogs, setTotalBlogs] = useState(0)
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState<BlogForm>(emptyForm)
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null)
  const [authorAvatarFile, setAuthorAvatarFile] = useState<File | null>(null)
  const { user } = useAuth()
  const pageSize = 10

  const fetchBlogs = async (page: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/blogs?page=${page}&limit=${pageSize}`)
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to load blogs')
      setBlogs(data.data || [])
      setTotalBlogs(data.total || 0)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load blogs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBlogs(currentPage)
  }, [currentPage])

  const updateField = <K extends keyof BlogForm>(key: K, value: BlogForm[K]) => {
    setFormData((current) => ({ ...current, [key]: value }))
  }

  const handleCreate = () => {
    setSelectedBlog(null)
    setFeaturedImageFile(null)
    setAuthorAvatarFile(null)
    setFormData({
      ...emptyForm,
      author_name: user?.userName || '',
    })
    setShowDialog(true)
  }

  const handleEdit = (blog: Blog) => {
    setSelectedBlog(blog)
    setFeaturedImageFile(null)
    setAuthorAvatarFile(null)
    setFormData({
      title_en: blog.title_en,
      excerpt_en: blog.excerpt_en || '',
      body_en: blog.body_en,
      featured_image: blog.featured_image || '',
      author_name: blog.author_name || '',
      author_avatar: blog.author_avatar || '',
      author_role_en: blog.author_role_en || '',
      author_bio_en: blog.author_bio_en || '',
      tags: (blog.tags || []).join(', '),
      pull_quote_en: blog.pull_quote_en || '',
      pull_quote_author: blog.pull_quote_author || '',
      status: blog.status,
      meta_title: blog.meta_title || '',
      meta_description: blog.meta_description || '',
      meta_keywords: blog.meta_keywords || '',
      canonical_url: blog.canonical_url || '',
      og_image: blog.og_image || '',
      previous_post_slug: blog.previous_post_slug || '',
      next_post_slug: blog.next_post_slug || '',
    })
    setShowDialog(true)
  }

  const handleFeaturedImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFeaturedImageFile(event.target.files?.[0] || null)
  }

  const handleAuthorAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAuthorAvatarFile(event.target.files?.[0] || null)
  }

  const calculateReadingTime = (text: string): string => {
    const wordsPerMinute = 200
    const wordCount = text.trim().split(/\s+/).length
    const minutes = Math.ceil(wordCount / wordsPerMinute)
    return `${minutes} min read`
  }

  const handleSave = async () => {
    if (!formData.title_en.trim() || !formData.body_en.trim()) {
      toast.error('English title and English body are required')
      return
    }

    try {
      let featuredImage = formData.featured_image
      if (featuredImageFile) {
        const imageData = new FormData()
        imageData.append('file', featuredImageFile)
        const uploadResponse = await fetch('/api/upload/blog/featured-image', { method: 'POST', body: imageData })
        const uploadData = await uploadResponse.json()
        if (!uploadResponse.ok) throw new Error(uploadData.error || 'Failed to upload featured image')
        featuredImage = uploadData.path
      }

      let authorAvatar = formData.author_avatar
      if (authorAvatarFile) {
        const imageData = new FormData()
        imageData.append('file', authorAvatarFile)
        const uploadResponse = await fetch('/api/upload/blog/author-avatar', { method: 'POST', body: imageData })
        const uploadData = await uploadResponse.json()
        if (!uploadResponse.ok) throw new Error(uploadData.error || 'Failed to upload author avatar')
        authorAvatar = uploadData.path
      }

      const payload = {
        ...formData,
        slug: selectedBlog?.slug || '',
        featured_image: featuredImage,
        author_avatar: authorAvatar,
        publish_date: getTodayDateTime(),
        reading_time: calculateReadingTime(formData.body_en),
        created_by: user?.userId || '',
        view_count: selectedBlog ? selectedBlog.view_count : 0,
      }
      const response = await fetch(selectedBlog ? `/api/blogs/${selectedBlog.id}` : '/api/blogs', {
        method: selectedBlog ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to save blog')
      toast.success(selectedBlog ? 'Blog updated successfully' : 'Blog created successfully')
      setShowDialog(false)
      fetchBlogs(currentPage)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save blog')
    }
  }

  const handleDelete = async (blog: Blog) => {
    if (!confirm(`Delete "${blog.title_en}"?`)) return
    try {
      const response = await fetch(`/api/blogs/${blog.id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to delete blog')
      toast.success('Blog deleted successfully')
      if (blogs.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1)
      else fetchBlogs(currentPage)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete blog')
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage editorial content, authors, and SEO metadata.</p>
        </div>
        <Button variant="solid" onClick={handleCreate}>Add Blog Post</Button>
      </div>

      {loading ? <div className="py-8 text-center">Loading blog posts...</div> : blogs.length === 0 ? (
        <Card><div className="py-12 text-center text-gray-500">No blog posts yet. Click "Add Blog Post" to create one.</div></Card>
      ) : (
        <div className="grid gap-4">
          {blogs.map((blog) => (
            <Card key={blog.id} className="p-5">
              <div className="flex gap-5">
                {blog.featured_image && <img src={blog.featured_image} alt="" className="h-24 w-32 rounded object-cover" onError={(event) => { event.currentTarget.style.display = 'none' }} />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2"><h2 className="text-lg font-semibold">{blog.title_en}</h2><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${blog.status === 'published' ? 'bg-emerald-100 text-emerald-700' : blog.status === 'archived' ? 'bg-gray-200 text-gray-700' : 'bg-amber-100 text-amber-700'}`}>{blog.status}</span></div>
                      <p className="mt-1 text-sm text-gray-500">/{blog.slug} · {blog.author_name || 'No author'} · {formatDateTime(blog.publish_date)}</p>
                    </div>
                    <div className="flex gap-2"><Button variant="text" size="sm" onClick={() => handleEdit(blog)}>Edit</Button><Button variant="text" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(blog)}>Delete</Button></div>
                  </div>
                  {blog.excerpt_en && <p className="mt-3 line-clamp-2 text-sm text-gray-700">{blog.excerpt_en}</p>}
                  <p className="mt-3 text-xs text-gray-500">{(blog.tags || []).join(', ') || 'No tags'} · {blog.view_count} views</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && totalBlogs > pageSize && <div className="mt-6 flex justify-center"><Pagination currentPage={currentPage} pageSize={pageSize} total={totalBlogs} onChange={setCurrentPage} /></div>}

      <Dialog isOpen={showDialog} onClose={() => setShowDialog(false)} onConfirm={handleSave} title={selectedBlog ? 'Edit Blog Post' : 'Add Blog Post'} confirmText={selectedBlog ? 'Update Blog' : 'Create Blog'} width={1000}>
        <div className="space-y-6 pr-2">
          <section className="space-y-4"><h2 className="font-semibold">Content</h2><div className="grid gap-4 md:grid-cols-2"><Field label="Slug *" value={formData.slug} onChange={(value) => updateField('slug', value)} placeholder="seo-friendly-url" /><Field label="English title *" value={formData.title_en} onChange={(value) => updateField('title_en', value)} /><label className="block"><span className="mb-1 block text-sm font-medium text-gray-700">Featured image</span><input type="file" accept="image/*" onChange={handleFeaturedImageChange} className="w-full rounded-md border border-gray-300 px-3 py-2" /></label>{featuredImageFile && <div className="col-span-2 flex items-center gap-2"><img src={URL.createObjectURL(featuredImageFile)} alt="Featured" className="h-20 w-32 rounded object-cover" /><button type="button" onClick={() => setFeaturedImageFile(null)} className="text-sm text-red-500 hover:text-red-700">Remove</button></div>}{formData.featured_image && !featuredImageFile && <div className="col-span-2 flex items-center gap-2"><img src={formData.featured_image} alt="Featured" className="h-20 w-32 rounded object-cover" /><button type="button" onClick={() => updateField('featured_image', '')} className="text-sm text-red-500 hover:text-red-700">Remove</button></div>}<Field label="Tags" value={formData.tags} onChange={(value) => updateField('tags', value)} placeholder="hiring, career, tips" /><label className="block"><span className="mb-1 block text-sm font-medium text-gray-700">Status</span><select value={formData.status} onChange={(event) => updateField('status', event.target.value as BlogStatus)} className="w-full rounded-md border border-gray-300 px-3 py-2"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label></div><TextArea label="English excerpt" value={formData.excerpt_en} onChange={(value) => updateField('excerpt_en', value)} /><TextArea label="English body *" value={formData.body_en} onChange={(value) => updateField('body_en', value)} rows={8} /></section>
          <section className="space-y-4"><h2 className="font-semibold">Author and quote</h2><div className="grid gap-4 md:grid-cols-2"><Field label="Author name" value={formData.author_name} onChange={(value) => updateField('author_name', value)} /><Field label="Author role" value={formData.author_role_en} onChange={(value) => updateField('author_role_en', value)} /><label className="block"><span className="mb-1 block text-sm font-medium text-gray-700">Author avatar</span><input type="file" accept="image/*" onChange={handleAuthorAvatarChange} className="w-full rounded-md border border-gray-300 px-3 py-2" /></label>{authorAvatarFile && <div className="col-span-2 flex items-center gap-2"><img src={URL.createObjectURL(authorAvatarFile)} alt="Author avatar" className="h-20 w-20 rounded object-cover" /><button type="button" onClick={() => setAuthorAvatarFile(null)} className="text-sm text-red-500 hover:text-red-700">Remove</button></div>}{formData.author_avatar && !authorAvatarFile && <div className="col-span-2 flex items-center gap-2"><img src={formData.author_avatar} alt="Author avatar" className="h-20 w-20 rounded object-cover" /><button type="button" onClick={() => updateField('author_avatar', '')} className="text-sm text-red-500 hover:text-red-700">Remove</button></div>}<Field label="Quote author" value={formData.pull_quote_author} onChange={(value) => updateField('pull_quote_author', value)} /></div><TextArea label="Author bio" value={formData.author_bio_en} onChange={(value) => updateField('author_bio_en', value)} /><TextArea label="Pull quote" value={formData.pull_quote_en} onChange={(value) => updateField('pull_quote_en', value)} /></section>
          <section className="space-y-4"><h2 className="font-semibold">SEO</h2><div className="grid gap-4 md:grid-cols-2"><Field label="Meta title" value={formData.meta_title} onChange={(value) => updateField('meta_title', value)} /><Field label="Meta keywords" value={formData.meta_keywords} onChange={(value) => updateField('meta_keywords', value)} placeholder="jobs, careers, hiring" /><Field label="Canonical URL" value={formData.canonical_url} onChange={(value) => updateField('canonical_url', value)} type="url" /><Field label="Open Graph image URL" value={formData.og_image} onChange={(value) => updateField('og_image', value)} type="url" /></div><TextArea label="Meta description" value={formData.meta_description} onChange={(value) => updateField('meta_description', value)} /></section>
          <section className="space-y-4"><h2 className="font-semibold">Links and tracking</h2><div className="grid gap-4 md:grid-cols-2"><label className="block"><span className="mb-1 block text-sm font-medium text-gray-700">Previous post</span><select value={formData.previous_post_slug} onChange={(event) => updateField('previous_post_slug', event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2"><option value="">None</option>{blogs.filter(b => b.slug !== selectedBlog?.slug).map(b => <option key={b.id} value={b.slug}>{b.title_en}</option>)}</select></label><label className="block"><span className="mb-1 block text-sm font-medium text-gray-700">Next post</span><select value={formData.next_post_slug} onChange={(event) => updateField('next_post_slug', event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2"><option value="">None</option>{blogs.filter(b => b.slug !== selectedBlog?.slug).map(b => <option key={b.id} value={b.slug}>{b.title_en}</option>)}</select></label></div></section>
        </div>
      </Dialog>
    </div>
  )
}

export default Blog
