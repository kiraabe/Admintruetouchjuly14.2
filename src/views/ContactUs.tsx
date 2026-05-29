import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Dialog from '@/components/ui/Dialog'
import { toast } from 'sonner'
import { apiCreateNotification } from '@/services/CommonService'
import { useSessionUser } from '@/store/authStore'

interface ContactMessage {
  id?: number
  contact_id: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  status: 'new' | 'replied' | 'resolved'
  created_at: string
  updated_at: string
}

const ContactUs = () => {
  const { user } = useSessionUser()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [filteredMessages, setFilteredMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchMessages()
  }, [])

  useEffect(() => {
    filterMessages()
  }, [searchTerm, messages])

  const createNotification = async (target: string, description: string, relatedId?: string) => {
    try {
      await apiCreateNotification({
        target,
        description,
        type: 1,
        location: 'Contact Messages',
        locationLabel: 'Contact Us',
        status: 'new',
        user_id: user.userId,
        related_entity_id: relatedId,
        related_entity_type: 'contact_message',
        image_url: '/img/icons/contact.png',
      })
    } catch (error) {
      console.error('Error creating notification:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/contact-us')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        const newMessages = data.data || []
        setMessages(newMessages)

        // Create notifications for new messages
        newMessages.forEach((msg) => {
          if (msg.status === 'new') {
            createNotification(
              msg.name,
              `New message from ${msg.name}: "${msg.subject}"`,
              msg.contact_id
            )
          }
        })
      } else {
        toast.error(data.error || 'Failed to load messages')
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const filterMessages = () => {
    const filtered = messages.filter((msg) =>
      (msg.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (msg.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (msg.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
    setFilteredMessages(filtered)
    setCurrentPage(1)
  }

  const handleViewDetail = (message: ContactMessage) => {
    setSelectedMessage(message)
    setShowDetailModal(true)
  }

  const handleReply = (message: ContactMessage) => {
    setSelectedMessage(message)
    setReplyMessage('')
    setShowReplyModal(true)
  }

  const handleSendReply = async () => {
    if (!selectedMessage || !replyMessage.trim()) {
      toast.error('Please enter a reply message')
      return
    }

    try {
      const response = await fetch(`/api/contact-us/${selectedMessage.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyMessage }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Reply sent successfully')

        // Create notification for reply sent
        createNotification(
          'Admin Reply',
          `Reply sent to ${selectedMessage.name} regarding "${selectedMessage.subject}"`,
          selectedMessage.contact_id
        )

        setShowReplyModal(false)
        setReplyMessage('')
        fetchMessages()
      } else {
        toast.error(data.error || 'Failed to send reply')
      }
    } catch (error) {
      console.error('Error sending reply:', error)
      toast.error('Failed to send reply')
    }
  }

  const handleChangeStatus = async (contactId: string, newStatus: ContactMessage['status']) => {
    try {
      const response = await fetch(`/api/contact-us/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Status updated')

        // Create notification for status change
        const statusLabels: { [key: string]: string } = {
          'new': 'New message received',
          'replied': 'Message replied',
          'resolved': 'Message resolved'
        }
        createNotification(
          'Status Updated',
          `Contact message status changed to "${newStatus}"`,
          contactId
        )

        fetchMessages()
      } else {
        toast.error(data.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const paginatedMessages = filteredMessages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const totalPages = Math.ceil(filteredMessages.length / itemsPerPage)

  const getStatusBadgeClass = (status: ContactMessage['status']) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800'
      case 'replied':
        return 'bg-yellow-100 text-yellow-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Contact Messages</h1>
        <Button onClick={fetchMessages}>Refresh</Button>
      </div>

      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search by name, email, or subject..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-8">Loading messages...</div>
      ) : paginatedMessages.length === 0 ? (
        <div className="text-center py-8">No messages found</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Subject</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMessages.map((msg) => (
                  <tr key={msg.id || msg.contact_id} className="border-b dark:border-gray-700">
                    <td className="px-4 py-3">{msg.name}</td>
                    <td className="px-4 py-3">{msg.email}</td>
                    <td className="px-4 py-3">{msg.subject}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(msg.status)}`}>
                        {msg.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{new Date(msg.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleViewDetail(msg)}
                          className="text-xs"
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReply(msg)}
                          className="text-xs"
                        >
                          Reply
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Dialog
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        width={600}
      >
        {selectedMessage && (
          <div>
            <h2 className="text-lg font-bold mb-4">{selectedMessage.subject}</h2>
            <div className="space-y-4">
              <div>
                <label className="font-semibold text-gray-600 dark:text-gray-400">From</label>
                <p>{selectedMessage.name} ({selectedMessage.email})</p>
              </div>
              {selectedMessage.phone && (
                <div>
                  <label className="font-semibold text-gray-600 dark:text-gray-400">Phone</label>
                  <p>{selectedMessage.phone}</p>
                </div>
              )}
              <div>
                <label className="font-semibold text-gray-600 dark:text-gray-400">Status</label>
                <div className="flex gap-2 mt-2">
                  {(['new', 'replied', 'resolved'] as const).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      onClick={() => handleChangeStatus(selectedMessage.contact_id, status)}
                      className={selectedMessage.status === status ? 'bg-blue-600' : ''}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-semibold text-gray-600 dark:text-gray-400">Message</label>
                <p className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg whitespace-pre-wrap">
                  {selectedMessage.message}
                </p>
              </div>
              <div>
                <label className="font-semibold text-gray-600 dark:text-gray-400">Received</label>
                <p>{new Date(selectedMessage.created_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={() => setShowDetailModal(false)}>Close</Button>
              <Button onClick={() => {
                setShowDetailModal(false)
                handleReply(selectedMessage)
              }}>
                Reply
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Reply Modal */}
      <Dialog
        isOpen={showReplyModal}
        onClose={() => setShowReplyModal(false)}
        width={600}
      >
        {selectedMessage && (
          <div>
            <h2 className="text-lg font-bold mb-4">Reply to: {selectedMessage.name}</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Original message:</p>
                <p className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                  {selectedMessage.message}
                </p>
              </div>
              <div>
                <label className="form-label">Your Reply</label>
                <textarea
                  placeholder="Type your reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={5}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={() => setShowReplyModal(false)}>Cancel</Button>
              <Button onClick={handleSendReply}>Send Reply</Button>
            </div>
          </div>
        )}
      </Dialog>
    </Card>
  )
}

export default ContactUs
