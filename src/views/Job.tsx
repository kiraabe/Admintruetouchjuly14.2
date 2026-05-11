import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Dialog from '@/components/ui/Dialog'
import { toast } from 'sonner'

interface Job {
  id: string
  title: string
  description: string
  author: string
  image_url: string | null
  expire_date: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

const Job = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: 'admin',
    expire_date: '',
    status: 'active' as 'active' | 'inactive',
  })

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/jobs')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        setJobs(data.data || [])
      } else {
        toast.error(data.error || 'Failed to load jobs')
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setFormData({
      title: '',
      description: '',
      author: 'admin',
      expire_date: '',
      status: 'active',
    })
    setSelectedJob(null)
    setImageFile(null)
    setImagePreview('')
    setShowAddModal(true)
  }

  const handleEdit = (job: Job) => {
    setSelectedJob(job)
    setFormData({
      title: job.title,
      description: job.description,
      author: job.author,
      expire_date: job.expire_date,
      status: job.status,
    })
    if (job.image_url) {
      setImagePreview(job.image_url)
    }
    setShowEditModal(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!formData.title || !formData.description || !formData.expire_date) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('author', formData.author)
      formDataToSend.append('expire_date', formData.expire_date)
      formDataToSend.append('status', formData.status)

      if (imageFile) {
        formDataToSend.append('image', imageFile)
      } else if (selectedJob && selectedJob.image_url) {
        // Keep existing image URL when not changing it
        formDataToSend.append('image_url', selectedJob.image_url)
      }

      if (selectedJob) {
        const response = await fetch(`/api/jobs/${selectedJob.id}`, {
          method: 'PUT',
          body: formDataToSend,
        })
        if (!response.ok) throw new Error('Failed to update job')
        toast.success('Job updated successfully')
        setShowEditModal(false)
      } else {
        const response = await fetch('/api/jobs', {
          method: 'POST',
          body: formDataToSend,
        })
        if (!response.ok) throw new Error('Failed to create job')
        toast.success('Job added successfully')
        setShowAddModal(false)
      }
      await fetchJobs()
    } catch (error) {
      toast.error('Failed to save job')
    }
  }

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete job')
      toast.success('Job deleted successfully')
      await fetchJobs()
    } catch (error) {
      toast.error('Failed to delete job')
    }
  }

  const handleToggleStatus = async (job: Job) => {
    try {
      const newStatus = job.status === 'active' ? 'inactive' : 'active'
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...job,
          status: newStatus,
        }),
      })
      if (!response.ok) throw new Error('Failed to update job status')
      toast.success(`Job ${newStatus}`)
      await fetchJobs()
    } catch (error) {
      toast.error('Failed to update job status')
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Job Posts</h1>
        <Button onClick={handleAddNew} variant="solid">
          Add New Job
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            No job posts yet. Click "Add New Job" to create one.
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Card key={job.id} className="p-6">
              <div className="flex gap-6">
                {job.image_url && (
                  <div className="flex-shrink-0">
                    <img
                      src={job.image_url}
                      alt={job.title}
                      className="w-32 h-32 object-cover rounded"
                    />
                  </div>
                )}
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold">{job.title}</h3>
                      <p className="text-sm text-gray-500">By {job.author}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleStatus(job)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          job.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {job.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{job.description}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Expires: {new Date(job.expire_date).toLocaleDateString()}</span>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(job)}
                        variant="text"
                        size="sm"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(job.id)}
                        variant="text"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Dialog
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onConfirm={handleSave}
        title="Add New Job Post"
        confirmText="Add Job"
        width={720}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title (max 56 chars)</label>
            <Input
              type="text"
              maxLength={56}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Job title"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.title.length}/56</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description (max 78 chars)</label>
            <Input
              type="text"
              maxLength={78}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Job description"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/78</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Author (max 15 chars)</label>
            <Input
              type="text"
              maxLength={15}
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              placeholder="Author name"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.author.length}/15</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Expire Date (14 chars)</label>
            <Input
              type="date"
              value={formData.expire_date}
              onChange={(e) => setFormData({ ...formData, expire_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Image (720x698)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onConfirm={handleSave}
        title="Edit Job Post"
        confirmText="Update Job"
        width={720}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title (max 56 chars)</label>
            <Input
              type="text"
              maxLength={56}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Job title"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.title.length}/56</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description (max 78 chars)</label>
            <Input
              type="text"
              maxLength={78}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Job description"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/78</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Author (max 15 chars)</label>
            <Input
              type="text"
              maxLength={15}
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              placeholder="Author name"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.author.length}/15</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Expire Date (14 chars)</label>
            <Input
              type="date"
              value={formData.expire_date}
              onChange={(e) => setFormData({ ...formData, expire_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Image (720x698)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default Job
