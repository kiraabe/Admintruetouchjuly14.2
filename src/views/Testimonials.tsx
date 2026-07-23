import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Dialog from '@/components/ui/Dialog'
import Pagination from '@/components/ui/Pagination'
import { toast } from 'sonner'
import Cookies from 'js-cookie'
import { getBlogImageUrl } from '@/utils/imageUrl'

type TestimonialStatus = 'active' | 'inactive'

type Testimonial = {
    id: number
    client_name: string
    company_name: string
    designation: string
    avatar_image: string | null
    rating: number
    testimonial_text: string
    status: TestimonialStatus
    display_order: number
    created_at: string
    updated_at: string
}

type TestimonialForm = Omit<Testimonial, 'id' | 'created_at' | 'updated_at'> & {
    avatar_image: string
}

const emptyForm: TestimonialForm = {
    client_name: '',
    company_name: '',
    designation: '',
    avatar_image: '',
    rating: 5,
    testimonial_text: '',
    status: 'active',
    display_order: 0,
}

const Field = ({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; placeholder?: string }) => (
    <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
        <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
)

const StarRating = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => (
    <div>
        <span className="mb-1 block text-sm font-medium text-gray-700">Rating *</span>
        <div className="flex h-12 items-center gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={value === star}
                    aria-label={`${star} star${star === 1 ? '' : 's'}`}
                    onClick={() => onChange(star)}
                    className={`text-3xl leading-none transition-colors ${star <= value ? 'text-amber-400' : 'text-gray-300'} hover:text-amber-400`}
                >
                    ★
                </button>
            ))}
        </div>
    </div>
)

const Testimonials = () => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [selected, setSelected] = useState<Testimonial | null>(null)
    const [formData, setFormData] = useState<TestimonialForm>(emptyForm)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [showDialog, setShowDialog] = useState(false)
    const pageSize = 10

    const getAuthHeaders = () => {
        const token = Cookies.get('token') || localStorage.getItem('token')
        return { Authorization: `Bearer ${token}` }
    }

    const fetchTestimonials = async (page: number) => {
        try {
            setLoading(true)
            const response = await fetch(`/api/testimonials?page=${page}&limit=${pageSize}`, { headers: getAuthHeaders() })
            const data = await response.json()
            if (!response.ok || !data.success) throw new Error(data.error || 'Failed to load testimonials')
            setTestimonials(data.data || [])
            setTotal(data.total || 0)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to load testimonials')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchTestimonials(currentPage) }, [currentPage])

    const updateField = <K extends keyof TestimonialForm>(key: K, value: TestimonialForm[K]) => {
        setFormData((current) => ({ ...current, [key]: value }))
    }

    const handleCreate = () => {
        setSelected(null)
        setFormData({ ...emptyForm })
        setAvatarFile(null)
        setShowDialog(true)
    }

    const handleEdit = (testimonial: Testimonial) => {
        setSelected(testimonial)
        setFormData({
            client_name: testimonial.client_name,
            company_name: testimonial.company_name,
            designation: testimonial.designation,
            avatar_image: testimonial.avatar_image || '',
            rating: testimonial.rating,
            testimonial_text: testimonial.testimonial_text,
            status: testimonial.status,
            display_order: testimonial.display_order,
        })
        setAvatarFile(null)
        setShowDialog(true)
    }

    const handleSave = async () => {
        if (!formData.client_name.trim() || !formData.company_name.trim() || !formData.designation.trim() || !formData.testimonial_text.trim()) {
            toast.error('Client name, company name, designation, and testimonial text are required')
            return
        }
        try {
            let avatarImage = formData.avatar_image
            if (avatarFile) {
                const uploadData = new FormData()
                uploadData.append('file', avatarFile)
                const uploadResponse = await fetch('/api/upload/testimonial/avatar', { method: 'POST', body: uploadData })
                const uploaded = await uploadResponse.json()
                if (!uploadResponse.ok) throw new Error(uploaded.error || 'Failed to upload avatar')
                avatarImage = uploaded.path
            }
            const response = await fetch(selected ? `/api/testimonials/${selected.id}` : '/api/testimonials', {
                method: selected ? 'PUT' : 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, avatar_image: avatarImage }),
            })
            const data = await response.json()
            if (!response.ok || !data.success) throw new Error(data.error || 'Failed to save testimonial')
            toast.success(selected ? 'Testimonial updated successfully' : 'Testimonial created successfully')
            setShowDialog(false)
            fetchTestimonials(currentPage)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save testimonial')
        }
    }

    const handleDelete = async (testimonial: Testimonial) => {
        if (!confirm(`Delete testimonial from ${testimonial.client_name}?`)) return
        try {
            const response = await fetch(`/api/testimonials/${testimonial.id}`, { method: 'DELETE', headers: getAuthHeaders() })
            const data = await response.json()
            if (!response.ok || !data.success) throw new Error(data.error || 'Failed to delete testimonial')
            toast.success('Testimonial deleted successfully')
            if (testimonials.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1)
            else fetchTestimonials(currentPage)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete testimonial')
        }
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Testimonials</h1>
                    <p className="mt-1 text-sm text-gray-500">Create and manage customer testimonials.</p>
                </div>
                <Button variant="solid" onClick={handleCreate}>Add Testimonial</Button>
            </div>
            {loading ? <div className="py-8 text-center">Loading testimonials...</div> : testimonials.length === 0 ? (
                <Card><div className="py-12 text-center text-gray-500">No testimonials yet. Click &quot;Add Testimonial&quot; to create one.</div></Card>
            ) : (
                <div className="grid gap-4">
                    {testimonials.map((testimonial) => (
                        <Card key={testimonial.id} className="p-5">
                            <div className="flex gap-4">
                                {testimonial.avatar_image && <img src={getBlogImageUrl(testimonial.avatar_image)} alt="" className="h-16 w-16 rounded-full object-cover" />}
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="font-semibold">{testimonial.client_name}</h2>
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${testimonial.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}>{testimonial.status}</span>
                                            </div>
                                            <p className="text-sm text-gray-500">{testimonial.designation} at {testimonial.company_name} · {'★'.repeat(testimonial.rating)}{'☆'.repeat(5 - testimonial.rating)}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="text" size="sm" onClick={() => handleEdit(testimonial)}>Edit</Button>
                                            <Button variant="text" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(testimonial)}>Delete</Button>
                                        </div>
                                    </div>
                                    <p className="mt-3 line-clamp-3 text-sm text-gray-700">{testimonial.testimonial_text}</p>
                                    <p className="mt-2 text-xs text-gray-500">Display order: {testimonial.display_order}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            {!loading && total > pageSize && <div className="mt-6 flex justify-center"><Pagination currentPage={currentPage} pageSize={pageSize} total={total} onChange={setCurrentPage} /></div>}
            <Dialog isOpen={showDialog} onClose={() => setShowDialog(false)} onConfirm={handleSave} title={selected ? 'Edit Testimonial' : 'Add Testimonial'} confirmText={selected ? 'Update Testimonial' : 'Create Testimonial'} width={720}>
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Client name *" value={formData.client_name} onChange={(value) => updateField('client_name', value)} />
                        <Field label="Company name *" value={formData.company_name} onChange={(value) => updateField('company_name', value)} />
                        <Field label="Designation *" value={formData.designation} onChange={(value) => updateField('designation', value)} />
                        <StarRating value={formData.rating} onChange={(value) => updateField('rating', value)} />
                        <Field label="Display order" type="number" value={formData.display_order} onChange={(value) => updateField('display_order', Number(value))} />
                        <label className="block"><span className="mb-1 block text-sm font-medium text-gray-700">Status</span><select value={formData.status} onChange={(event) => updateField('status', event.target.value as TestimonialStatus)} className="w-full rounded-md border border-gray-300 px-3 py-2"><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
                    </div>
                    <label className="block"><span className="mb-1 block text-sm font-medium text-gray-700">Avatar image</span><input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(event) => setAvatarFile(event.target.files?.[0] || null)} className="w-full rounded-md border border-gray-300 px-3 py-2" /></label>
                    {(avatarFile || formData.avatar_image) && <img src={avatarFile ? URL.createObjectURL(avatarFile) : getBlogImageUrl(formData.avatar_image)} alt="Avatar preview" className="h-20 w-20 rounded-full object-cover" />}
                    <label className="block"><span className="mb-1 block text-sm font-medium text-gray-700">Testimonial text *</span><textarea value={formData.testimonial_text} onChange={(event) => updateField('testimonial_text', event.target.value)} rows={6} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" /></label>
                </div>
            </Dialog>
        </div>
    )
}

export default Testimonials
