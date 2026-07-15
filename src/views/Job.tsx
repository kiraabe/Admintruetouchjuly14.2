import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Dialog from '@/components/ui/Dialog'
import Pagination from '@/components/ui/Pagination'
import { toast } from 'sonner'

type JobStatus = 'active' | 'inactive'

type Job = {
  id: string
  title: string
  description: string
  author: string
  image_url: string | null
  expire_date: string
  status: JobStatus
  created_at: string
  updated_at: string
}

type JobForm = {
  title: string
  description: string
  author: string
  expire_date: string
  status: JobStatus
}

const emptyForm: JobForm = {
  title: '',
  description: '',
  author: 'admin',
  expire_date: '',
  status: 'active',
}

const formatDate = (value: string | null) => value ? new Date(value).toLocaleDateString() : 'No expiry date'

const Job = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalJobs, setTotalJobs] = useState(0)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [formData, setFormData] = useState<JobForm>(emptyForm)
  const pageSize = 10

  const fetchJobs = async (page: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/jobs?page=${page}&limit=${pageSize}`)
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to load jobs')
      setJobs(data.data || [])
      setTotalJobs(data.total || 0)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs(currentPage)
  }, [currentPage])

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl || imageUrl.startsWith('/')) return imageUrl || ''
    return `/uploads/${imageUrl}`
  }

  const handleCreate = () => {
    setSelectedJob(null)
    setFormData(emptyForm)
    setImageFile(null)
    setImagePreview('')
    setShowDialog(true)
  }

  const handleEdit = (job: Job) => {
    setSelectedJob(job)
    setFormData({
      title: job.title,
      description: job.description,
      author: job.author,
      expire_date: job.expire_date ? new Date(job.expire_date).toISOString().split('T')[0] : '',
      status: job.status,
    })
    setImageFile(null)
    setImagePreview(getImageUrl(job.image_url))
    setShowDialog(true)
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.expire_date) {
      toast.error('Title, description, and expiry date are required')
      return
    }

    try {
      const payload: JobForm & { image_url?: string } = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        author: formData.author.trim() || 'admin',
        expire_date: new Date(formData.expire_date).toISOString(),
      }

      if (imageFile) {
        const imageData = new FormData()
        imageData.append('file', imageFile)
        const uploadResponse = await fetch('/api/upload/job/image', { method: 'POST', body: imageData })
        const uploadData = await uploadResponse.json()
        if (!uploadResponse.ok) throw new Error(uploadData.error || 'Failed to upload image')
        payload.image_url = uploadData.path
      } else if (selectedJob?.image_url) {
        payload.image_url = selectedJob.image_url
      }

      const response = await fetch(selectedJob ? `/api/jobs/${selectedJob.id}` : '/api/jobs', {
        method: selectedJob ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to save job')

      toast.success(selectedJob ? 'Job updated successfully' : 'Job created successfully')
      setShowDialog(false)
      setImageFile(null)
      setImagePreview('')
      fetchJobs(currentPage)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save job')
    }
  }

  const handleDelete = async (job: Job) => {
    if (!confirm(`Delete “${job.title}”?`)) return
    try {
      const response = await fetch(`/api/jobs/${job.id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to delete job')
      toast.success('Job deleted successfully')
      if (jobs.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1)
      else fetchJobs(currentPage)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete job')
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job Posts</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage active job listings.</p>
        </div>
        <Button variant="solid" onClick={handleCreate}>Add Job Post</Button>
      </div>

      {loading ? <div className="py-8 text-center">Loading job posts...</div> : jobs.length === 0 ? (
        <Card><div className="py-12 text-center text-gray-500">No job posts yet. Click “Add Job Post” to create one.</div></Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Card key={job.id} className="p-5">
              <div className="flex gap-5">
                {job.image_url && <img src={getImageUrl(job.image_url)} alt="" className="h-24 w-32 rounded object-cover" onError={(event) => { event.currentTarget.style.display = 'none' }} />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2"><h2 className="text-lg font-semibold">{job.title}</h2><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${job.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}>{job.status}</span></div>
                      <p className="mt-1 text-sm text-gray-500">{job.author || 'No author'} · Expires {formatDate(job.expire_date)}</p>
                    </div>
                    <div className="flex gap-2"><Button variant="text" size="sm" onClick={() => handleEdit(job)}>Edit</Button><Button variant="text" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(job)}>Delete</Button></div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-gray-700">{job.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && totalJobs > pageSize && <div className="mt-6 flex justify-center"><Pagination currentPage={currentPage} pageSize={pageSize} total={totalJobs} onChange={setCurrentPage} /></div>}

      <Dialog isOpen={showDialog} onClose={() => setShowDialog(false)} onConfirm={handleSave} title={selectedJob ? 'Edit Job Post' : 'Add Job Post'} confirmText={selectedJob ? 'Update Job' : 'Create Job'} width={800}>
        <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-2">
          <section className="space-y-4">
            <h2 className="font-semibold">Job details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2"><span className="mb-1 block text-sm font-medium text-gray-700">Title *</span><Input value={formData.title} maxLength={56} onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))} placeholder="Job title" /></label>
              <label className="block"><span className="mb-1 block text-sm font-medium text-gray-700">Author</span><Input value={formData.author} maxLength={15} onChange={(event) => setFormData((current) => ({ ...current, author: event.target.value }))} placeholder="Author name" /></label>
              <label className="block"><span className="mb-1 block text-sm font-medium text-gray-700">Expiry date *</span><Input type="date" value={formData.expire_date} onChange={(event) => setFormData((current) => ({ ...current, expire_date: event.target.value }))} /></label>
              <label className="block"><span className="mb-1 block text-sm font-medium text-gray-700">Status</span><select value={formData.status} onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value as JobStatus }))} className="w-full rounded-md border border-gray-300 px-3 py-2"><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
              <label className="block"><span className="mb-1 block text-sm font-medium text-gray-700">Job image</span><input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:rounded file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100" /></label>
            </div>
            {imagePreview && <img src={imagePreview} alt="Job preview" className="h-32 w-40 rounded object-cover" />}
            <label className="block"><span className="mb-1 block text-sm font-medium text-gray-700">Description *</span><textarea value={formData.description} onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))} placeholder="Job description" rows={8} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" /></label>
          </section>
        </div>
      </Dialog>
    </div>
  )
}

export default Job
